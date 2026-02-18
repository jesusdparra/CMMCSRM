'use client';

import { useEffect, useState, useMemo, useCallback, memo, startTransition } from 'react';
import { NISTCatalog } from '@/types/nist';
import FamilyList from '@/components/FamilyList';
import dynamic from 'next/dynamic';
import { LayoutDashboard, FileText, BarChart3, Upload, Save, Loader2 } from 'lucide-react';
import { useSRMStore, NISTRevision } from '@/store/useSRMStore';

const ControlView = dynamic(() => import('@/components/ControlView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ),
});

const ResponsibilityGraph = dynamic(() => import('@/components/ResponsibilityGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ),
});

const PDFGenerator = dynamic(() => import('@/components/PDFGenerator'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg animate-pulse text-sm">
      Loading PDF Tools...
    </div>
  ),
});

interface ExportData {
  version: number;
  revision: NISTRevision;
  exportedAt: string;
  entries: Record<string, { responsibility: string; implementation: string }>;
}

function SRMAppContent() {
  const [catalog, setCatalog] = useState<NISTCatalog | null>(null);
  const [catalogRevision, setCatalogRevision] = useState<NISTRevision | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [view, setView] = useState<'editor' | 'graph'>('editor');
  const [isLoading, setIsLoading] = useState(true);
  const [includeImplementation, setIncludeImplementation] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('srm-include-implementation');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const revision = useSRMStore((state) => state.revision);
  const setRevision = useSRMStore((state) => state.setRevision);

  const dataFile = useMemo(() => {
    return revision === 'rev2' ? '/data/controls-v2.json' : '/data/controls.json';
  }, [revision]);

  useEffect(() => {
    setIsLoading(true);
    setCatalog(null);
    const controller = new AbortController();
    const currentRevision = revision;
    fetch(dataFile, { signal: controller.signal, cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setCatalog(data);
        setCatalogRevision(currentRevision);
        setSelectedFamilyId(data.families[0]?.id ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load catalog:', err);
          setIsLoading(false);
        }
      });
    return () => controller.abort();
  }, [dataFile, revision]);

  const handleRevisionChange = useCallback((newRevision: NISTRevision) => {
    startTransition(() => {
      setRevision(newRevision);
    });
  }, [setRevision]);

  const exportData = useCallback(() => {
    const state = useSRMStore.getState();
    const currentEntries = state.entries;
    const allFamilies = catalog?.families || [];
    
    const exportEntries: Record<string, { responsibility: string; implementation: string }> = {};
    
    allFamilies.forEach(family => {
      family.controls.forEach(control => {
        control.objectives.forEach(obj => {
          const existing = currentEntries[obj.id];
          exportEntries[obj.id] = {
            responsibility: existing?.responsibility || 'Customer',
            implementation: existing?.implementation || '',
          };
        });
      });
    });
    
    const exportPayload: ExportData = {
      version: 1,
      revision: state.revision,
      exportedAt: new Date().toISOString(),
      entries: exportEntries,
    };
    const dataStr = JSON.stringify(exportPayload, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `nist-800-171-${state.revision}-srm-data.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  }, [catalog]);

  const importData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const entries = json.entries || json;
        const fileRevision = json.revision || null;
        
        const revisionToSave = fileRevision || 'rev3';
        
        if (fileRevision && fileRevision !== revision) {
          const switchRevision = confirm(
            `This file was exported from ${fileRevision === 'rev2' ? 'Rev 2' : 'Rev 3'}. ` +
            `Switch to ${fileRevision === 'rev2' ? 'Rev 2' : 'Rev 3'} and import?`
          );
          if (!switchRevision) {
            e.target.value = '';
            return;
          }
        }
        
        localStorage.setItem('srm-storage', JSON.stringify({ state: { entries, revision: revisionToSave }, version: 0 }));
        window.location.reload();
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [revision, setRevision]);

  const revisionLabel = revision === 'rev2' ? 'Rev 2' : 'Rev 3';

  if (!catalog) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <LayoutDashboard className="w-12 h-12 mb-4 text-blue-500" />
          <p className="text-xl font-medium">Loading NIST 800-171 {revisionLabel} Catalog...</p>
        </div>
      </div>
    );
  }

  const selectedFamily = catalog.families.find((f) => f.id === selectedFamilyId);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            SRM Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">NIST SP 800-171 {revisionLabel}</p>
        </div>

        <div className="p-4 border-b border-slate-800">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            NIST Revision
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleRevisionChange('rev2')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                revision === 'rev2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Rev 2
            </button>
            <button
              onClick={() => handleRevisionChange('rev3')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                revision === 'rev3'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Rev 3
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setView('editor')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              view === 'editor' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Control Editor
          </button>
          <button
            onClick={() => setView('graph')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              view === 'graph' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Responsibility Graph
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : catalog ? (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Families
              </div>
              <FamilyList
                families={catalog.families}
                selectedFamilyId={selectedFamilyId}
                onSelectFamily={setSelectedFamilyId}
              />
            </>
          ) : null}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={exportData}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-xs font-medium"
            >
              <Save className="w-3 h-3" />
              Export JSON
            </button>
            <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-xs font-medium cursor-pointer">
              <Upload className="w-3 h-3" />
              Import JSON
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeImplementation}
              onChange={(e) => {
                setIncludeImplementation(e.target.checked);
                localStorage.setItem('srm-include-implementation', String(e.target.checked));
              }}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-400">Include Implementation in PDF</span>
          </label>
          
          <PDFGenerator 
            catalog={catalog} 
            revision={catalogRevision || revision} 
            includeImplementation={includeImplementation}
            includeGraph={false}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-slate-950">
        {isLoading || !catalog || catalogRevision !== revision ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-slate-400">Loading controls...</p>
            </div>
          </div>
        ) : view === 'editor' ? (
          <ControlView family={selectedFamily} />
        ) : (
          <ResponsibilityGraph families={catalog.families} revision={catalogRevision!} />
        )}
      </main>
    </div>
  );
}

export default memo(SRMAppContent);
