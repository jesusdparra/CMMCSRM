import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

export type Responsibility = 'Customer' | 'Corvid' | 'Shared';
export type NISTRevision = 'rev2' | 'rev3';

export interface ObjectiveEntry {
  responsibility: Responsibility;
  implementation: string;
}

interface SRMState {
  revision: NISTRevision;
  entries: Record<string, ObjectiveEntry>;
  setRevision: (revision: NISTRevision) => void;
  setEntry: (objectiveId: string, entry: Partial<ObjectiveEntry>) => void;
  reset: () => void;
  getEntry: (objectiveId: string) => ObjectiveEntry;
}

const DEFAULT_ENTRY: ObjectiveEntry = {
  responsibility: 'Customer',
  implementation: '',
};

export const useSRMStore = create<SRMState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        revision: 'rev3',
        entries: {},
        setRevision: (revision) => set({ revision }),
        setEntry: (objectiveId, entry) =>
          set((state) => ({
            entries: {
              ...state.entries,
              [objectiveId]: {
                responsibility: entry.responsibility || state.entries[objectiveId]?.responsibility || 'Customer',
                implementation: entry.implementation ?? state.entries[objectiveId]?.implementation ?? '',
              },
            },
          })),
        reset: () => set({ entries: {} }),
        getEntry: (objectiveId) => {
          return get().entries[objectiveId] || DEFAULT_ENTRY;
        },
      }),
      {
        name: 'srm-storage',
      }
    )
  )
);

export function useEntry(objectiveId: string) {
  const entry = useSRMStore((state) => state.entries[objectiveId]);
  const setEntry = useSRMStore((state) => state.setEntry);
  
  if (entry) {
    return entry;
  }
  return DEFAULT_ENTRY;
}
