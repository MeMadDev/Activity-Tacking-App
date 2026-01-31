export type CategoryType = 'FOOD' | 'FITNESS' | 'CONSUMPTION' | 'NOTE';

export interface Entry {
  id: string;
  category: CategoryType;
  subtype?: string; // e.g. 'Junk Food', 'Cardio', 'Alcohol'
  value?: string | number | boolean;
  notes?: string;
  timestamp: number; // Unix timestamp
  createdAt: number;
}

export interface Category {
  id: CategoryType;
  label: string;
  subtypes?: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'FOOD',
    label: 'Food',
    subtypes: ['Healthy', 'Junk', 'Snack', 'Meal'],
  },
  {
    id: 'FITNESS',
    label: 'Fitness',
    subtypes: ['Gym', 'Cardio', 'Walk', 'Sport'],
  },
  {
    id: 'CONSUMPTION',
    label: 'Consumption',
    subtypes: ['Alcohol', 'Caffeine', 'Nicotine', 'Water'],
  },
  {
    id: 'NOTE',
    label: 'Note',
  },
];
