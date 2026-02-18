'use client';

import { memo, useCallback, useState } from 'react';
import { NISTFamily, NISTControl, NISTObjective } from '@/types/nist';
import { useSRMStore, Responsibility } from '@/store/useSRMStore';
import { Users, User, ShieldCheck, FileText, Lightbulb } from 'lucide-react';
import controlTipsData from '@/public/data/control-tips.json';

interface ControlViewProps {
  family: NISTFamily | undefined;
}

interface TipsData {
  [controlLabel: string]: {
    evidence_artifacts: string[];
    implementation_tips: string;
  };
}

const tipsData: TipsData = (controlTipsData as unknown as { CMMC_Level_2_Practices?: { practices: { id: string; evidence_artifacts: string[]; implementation_tips: string }[] }[] }).CMMC_Level_2_Practices?.reduce((acc, family) => {
  family.practices.forEach(practice => {
    acc[practice.id] = {
      evidence_artifacts: practice.evidence_artifacts || [],
      implementation_tips: practice.implementation_tips || '',
    };
  });
  return acc;
}, {} as TipsData) || {};

interface ObjectiveRowProps {
  obj: NISTObjective;
}

function ObjectiveRowInner({ obj }: ObjectiveRowProps) {
  const responsibility = useSRMStore(
    useCallback((state) => state.entries[obj.id]?.responsibility || 'Customer', [obj.id])
  );
  const storedImplementation = useSRMStore(
    useCallback((state) => state.entries[obj.id]?.implementation || '', [obj.id])
  );
  const setEntry = useSRMStore((state) => state.setEntry);
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftImplementation, setDraftImplementation] = useState('');

  const handleResponsibilityClick = useCallback((r: Responsibility) => {
    setEntry(obj.id, { responsibility: r });
  }, [obj.id, setEntry]);

  const handleImplementationFocus = useCallback(() => {
    setDraftImplementation(storedImplementation);
    setIsEditing(true);
  }, [storedImplementation]);

  const handleImplementationBlur = useCallback(() => {
    setIsEditing(false);
    if (draftImplementation !== storedImplementation) {
      setEntry(obj.id, { implementation: draftImplementation });
    }
  }, [obj.id, draftImplementation, storedImplementation, setEntry]);

  const handleImplementationChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftImplementation(e.target.value);
  }, []);

  const displayValue = isEditing ? draftImplementation : storedImplementation;

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 transition-all hover:border-slate-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <p className="text-sm text-slate-400 leading-relaxed">
            <span className="text-blue-500 font-mono text-xs block mb-1">
              {obj.id.split('_').pop()}
            </span>
            {obj.prose.replace(/{{.*?}}/g, '___')}
          </p>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['Customer', 'Corvid', 'Shared'] as Responsibility[]).map((r) => (
              <button
                key={r}
                onClick={() => handleResponsibilityClick(r)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  responsibility === r
                    ? r === 'Customer' ? 'bg-green-500 text-white' :
                      r === 'Corvid' ? 'bg-blue-500 text-white' :
                      'bg-yellow-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {r === 'Customer' && <User className="w-3 h-3" />}
                {r === 'Corvid' && <ShieldCheck className="w-3 h-3" />}
                {r === 'Shared' && <Users className="w-3 h-3" />}
                {r}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Brief description of implementation..."
            value={displayValue}
            onChange={handleImplementationChange}
            onFocus={handleImplementationFocus}
            onBlur={handleImplementationBlur}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

const ObjectiveRow = memo(ObjectiveRowInner, (prev, next) => prev.obj.id === next.obj.id);

ObjectiveRow.displayName = 'ObjectiveRow';

interface ControlSectionProps {
  control: NISTControl;
  tips?: {
    evidence_artifacts: string[];
    implementation_tips: string;
  };
}

const ControlSection = memo(function ControlSection({ control, tips }: ControlSectionProps) {
  return (
    <section key={control.id} className="space-y-6">
      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Control {control.id}
            </span>
            <h3 className="text-2xl font-semibold text-white">{control.title}</h3>
          </div>
        </div>
        <div className="max-w-none">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
            {control.statement.replace(/\\n/g, '\n')}
          </p>
        </div>

        {tips && (tips.implementation_tips || (tips.evidence_artifacts && tips.evidence_artifacts.length > 0)) && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            {tips.implementation_tips && (
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-amber-400 mb-2">Implementation Tips</h5>
                    <p className="text-sm text-slate-300 leading-relaxed">{tips.implementation_tips}</p>
                  </div>
                </div>
              </div>
            )}
            
            {tips.evidence_artifacts && tips.evidence_artifacts.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-blue-400 mb-2">Evidence / Artifacts</h5>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {tips.evidence_artifacts.map((artifact, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          <span>{artifact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 pl-4 border-l-2 border-slate-800">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Assessment Objectives ({control.objectives.length})
        </h4>
        {control.objectives.map((obj) => (
          <ObjectiveRow key={obj.id} obj={obj} />
        ))}
      </div>
    </section>
  );
});

ControlSection.displayName = 'ControlSection';

export default function ControlView({ family }: ControlViewProps) {
  if (!family) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <header>
          <div className="flex items-center gap-3 text-blue-500 font-mono text-sm mb-2">
            <span>FAMILY {family.id}</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">{family.title}</h2>
          <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
        </header>

        <div className="space-y-16">
          {family.controls.map((control) => (
            <ControlSection 
              key={control.id} 
              control={control} 
              tips={tipsData[control.label]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
