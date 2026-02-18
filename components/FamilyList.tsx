'use client';

import { memo, useCallback, useMemo } from 'react';
import { NISTFamily } from '@/types/nist';
import { ChevronRight } from 'lucide-react';

interface FamilyListProps {
  families: NISTFamily[];
  selectedFamilyId: string | null;
  onSelectFamily: (id: string) => void;
}

function FamilyListComponent({ families, selectedFamilyId, onSelectFamily }: FamilyListProps) {
  const handleClick = useCallback((id: string) => {
    onSelectFamily(id);
  }, [onSelectFamily]);

  const familyButtons = useMemo(() => {
    return families.map((family) => {
      const isActive = selectedFamilyId === family.id;
      return (
        <button
          key={family.id}
          onClick={() => handleClick(family.id)}
          className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${
            isActive
              ? 'bg-slate-800 text-blue-400 shadow-lg border border-slate-700'
              : 'hover:bg-slate-800/50 text-slate-400'
          }`}
        >
          <div className="flex flex-col">
            <span className={`text-xs font-mono ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
              {family.id}
            </span>
            <span className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-white' : ''}`}>
              {family.title}
            </span>
          </div>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              isActive ? 'translate-x-1 text-blue-500' : 'opacity-0 group-hover:opacity-100'
            }`}
          />
        </button>
      );
    });
  }, [families, selectedFamilyId, handleClick]);

  return (
    <div className="space-y-1">
      {familyButtons}
    </div>
  );
}

export default memo(FamilyListComponent);
