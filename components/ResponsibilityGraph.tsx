'use client';

import React, { useRef, useCallback, useMemo, memo, useState, useEffect } from 'react';
import { NISTFamily } from '@/types/nist';
import { useSRMStore, NISTRevision } from '@/store/useSRMStore';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { FileDown } from 'lucide-react';

interface ResponsibilityGraphProps {
  families: NISTFamily[];
  revision: NISTRevision;
}

function ResponsibilityGraphComponent({ families, revision }: ResponsibilityGraphProps) {
  const [entries, setEntries] = useState(() => useSRMStore.getState().entries);
  const graphRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEntries(useSRMStore.getState().entries);
    const unsub = useSRMStore.subscribe((state) => state.entries, setEntries);
    return unsub;
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!graphRef.current) return;
    
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const graphElement = graphRef.current;
    
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 1400px;
      background: #1e293b;
      z-index: -9999;
      pointer-events: none;
    `;
    
    const innerContent = graphElement.cloneNode(true) as HTMLDivElement;
    innerContent.style.cssText = `
      width: 1400px;
      max-width: none;
      padding: 48px;
      background: #1e293b;
    `;
    
    const button = innerContent.querySelector('button');
    if (button) button.remove();
    
    exportContainer.appendChild(innerContent);
    document.body.appendChild(exportContainer);
    exportRef.current = exportContainer;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let data: string;
    try {
      data = await toPng(exportContainer, {
        backgroundColor: '#1e293b',
        pixelRatio: 2,
        fontEmbedCSS: '',
        skipFonts: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
      document.body.removeChild(exportContainer);
      exportRef.current = null;
      return;
    }
    
    document.body.removeChild(exportContainer);
    exportRef.current = null;
    
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight],
      });
      
      pdf.addImage(data, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('nist-800-171-srm-graph.pdf');
    };
    img.src = data;
  }, []);

  const familyStats = useMemo(() => {
    return families.map((family) => {
      let customer = 0;
      let corvid = 0;
      let shared = 0;
      let total = 0;

      family.controls.forEach((control) => {
        control.objectives.forEach((obj) => {
          const entry = entries[obj.id] || { responsibility: 'Customer' };
          if (entry.responsibility === 'Customer') customer++;
          else if (entry.responsibility === 'Corvid') corvid++;
          else if (entry.responsibility === 'Shared') shared++;
          total++;
        });
      });

      return {
        id: family.id,
        title: family.title,
        label: family.label,
        customer: total > 0 ? (customer / total) * 100 : 0,
        corvid: total > 0 ? (corvid / total) * 100 : 0,
        shared: total > 0 ? (shared / total) * 100 : 0,
        total,
      };
    });
  }, [families, entries]);

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-slate-800 text-white" data-graph-container>
      <div className="max-w-6xl mx-auto" ref={graphRef}>
        <header className="flex justify-between items-end mb-16 border-b border-slate-500 pb-8">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <img 
                  src="/logo.png" 
                  alt="CORVID" 
                  className="h-16 w-auto"
                />
                <div>
                  <h2 className="text-5xl font-bold tracking-tight mb-2 text-white">Shared Responsibility Matrix</h2>
                  <p className="text-blue-300 font-mono tracking-widest uppercase text-sm">
                    CMMC HPC Portal • NIST SP 800-171 {revision === 'rev2' ? 'Rev 2' : 'Rev 3'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors text-xs font-semibold uppercase tracking-widest text-white"
              >
                <FileDown className="w-4 h-4" />
                Export PDF
              </button>
            </div>
            <div className="flex gap-8 text-sm font-semibold uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-400"></div>
                <span className="text-blue-300">Corvid</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-400"></div>
                <span className="text-amber-300">Shared</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400"></div>
                <span className="text-emerald-300">Customer</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1fr_2fr] gap-x-12 gap-y-6">
          <div className="font-mono text-xs text-slate-300 uppercase tracking-[0.2em] pb-2 font-semibold">
            Control Family
          </div>
          <div className="font-mono text-xs text-slate-300 uppercase tracking-[0.2em] pb-2 font-semibold">
            Responsibility Distribution
          </div>

          {familyStats.map((stat, i) => (
            <React.Fragment key={stat.id}>
              <div className="flex items-baseline gap-6 group">
                <span className="text-4xl font-bold italic text-white group-hover:text-gray-200 transition-colors">
                  {stat.id.split('.').pop()}
                </span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors uppercase tracking-wider">
                  {stat.title}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-full h-8 bg-slate-700 rounded-sm overflow-hidden flex shadow-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.corvid}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                    className="h-full bg-blue-600"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.shared}%` }}
                    transition={{ duration: 1, delay: i * 0.05 + 0.5 }}
                    className="h-full bg-amber-500"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.customer}%` }}
                    transition={{ duration: 1, delay: i * 0.05 + 1 }}
                    className="h-full bg-emerald-600"
                  />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ResponsibilityGraphComponent);
