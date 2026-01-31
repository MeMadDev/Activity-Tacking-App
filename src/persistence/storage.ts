import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry } from '../domain/models';

const STORAGE_KEY = '@habit_tracker_entries';

export const entryRepository = {
    async getAll(): Promise<Entry[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to fetch entries', e);
            return [];
        }
    },

    async save(entry: Entry): Promise<void> {
        try {
            const currentEntries = await this.getAll();
            const updatedEntries = [entry, ...currentEntries];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
        } catch (e) {
            console.error('Failed to save entry', e);
        }
    },

    async delete(id: string): Promise<void> {
        try {
            const currentEntries = await this.getAll();
            const updatedEntries = currentEntries.filter((e) => e.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
        } catch (e) {
            console.error('Failed to delete entry', e);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error("Failed to clear entries", e);
        }
    }
};
