import { create } from 'zustand';
import { Entry } from '../domain/models';
import { entryRepository } from '../persistence/storage';

interface StoreState {
    entries: Entry[];
    isLoading: boolean;

    // Actions
    loadEntries: () => Promise<void>;
    addEntry: (entry: Entry) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
    entries: [],
    isLoading: false,

    loadEntries: async () => {
        set({ isLoading: true });
        const entries = await entryRepository.getAll();
        set({ entries, isLoading: false });
    },

    addEntry: async (entry) => {
        // Optimistic update
        const currentEntries = get().entries;
        set({ entries: [entry, ...currentEntries] });

        // Persist
        await entryRepository.save(entry);

        // Fallback reload if needed strictly, but optimistic is fine for local-first
    },

    deleteEntry: async (id) => {
        const currentEntries = get().entries;
        set({ entries: currentEntries.filter((e) => e.id !== id) });
        await entryRepository.delete(id);
    },
}));
