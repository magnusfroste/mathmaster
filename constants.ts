import { Theme } from './types';
import { BookOpen, Trophy, Medal } from 'lucide-react';

export const THEMES: Record<string, Theme> = {
  classic: {
    id: 'classic',
    name: 'Klassisk Matte',
    description: 'Traditionell matteövning',
    primaryColor: 'bg-indigo-600',
    secondaryColor: 'bg-indigo-500',
    accentColor: 'border-indigo-400',
    bgGradient: 'from-slate-900 via-purple-900 to-slate-900',
    cardBg: 'bg-blue-600',
    icon: 'book'
  },
  hockey: {
    id: 'hockey',
    name: 'Hockeymatch',
    description: 'Gör mål med matematik!',
    primaryColor: 'bg-red-600',
    secondaryColor: 'bg-red-500',
    accentColor: 'border-red-400',
    bgGradient: 'from-slate-900 via-red-900 to-slate-900',
    cardBg: 'bg-red-600',
    icon: 'stick'
  },
  football: {
    id: 'football',
    name: 'Fotbollsplan',
    description: 'Kickar igång med matte',
    primaryColor: 'bg-green-600',
    secondaryColor: 'bg-green-500',
    accentColor: 'border-green-400',
    bgGradient: 'from-slate-900 via-green-900 to-slate-900',
    cardBg: 'bg-green-600',
    icon: 'ball'
  }
};

export const LEVELS = [
  // Level 1: Introduction
  { level: 1, rangeA: [1, 3], rangeB: [1, 3], count: 3, time: 60, points: 10 },
  // Level 2: Easy
  { level: 2, rangeA: [1, 5], rangeB: [1, 5], count: 4, time: 60, points: 15 },
  // Level 3: Beginner - Removing 1s
  { level: 3, rangeA: [2, 6], rangeB: [2, 6], count: 4, time: 55, points: 20 },
  // Level 4: Intermediate
  { level: 4, rangeA: [3, 8], rangeB: [2, 8], count: 5, time: 50, points: 25 },
  // Level 5: Standard
  { level: 5, rangeA: [2, 10], rangeB: [2, 10], count: 5, time: 45, points: 30 },
  // Level 6: Tricky
  { level: 6, rangeA: [4, 11], rangeB: [2, 11], count: 6, time: 45, points: 35 },
  // Level 7: Hard
  { level: 7, rangeA: [3, 12], rangeB: [3, 12], count: 6, time: 40, points: 40 },
  // Level 8: Expert
  { level: 8, rangeA: [6, 12], rangeB: [4, 12], count: 7, time: 35, points: 50 },
  // Level 9: Master
  { level: 9, rangeA: [2, 12], rangeB: [2, 12], count: 8, time: 30, points: 60 },
  // Level 10: Grandmaster
  { level: 10, rangeA: [3, 15], rangeB: [3, 15], count: 10, time: 45, points: 100 },
];