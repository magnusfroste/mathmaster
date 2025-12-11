
export type ThemeId = 'classic' | 'hockey' | 'football';
export type Operation = 'multiplication' | 'addition' | 'subtraction' | 'division' | 'percentage' | 'exponentiation' | 'algebra';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  cardBg: string;
  icon: string;
}

export interface Problem {
  id: string;
  factorA: number;
  factorB: number;
  answer: number;
  operator: Operation;
}

export interface GameState {
  score: number;
  coins: number;
  level: number;
  streak: number;
  timeLeft: number;
}

export type GamePhase = 'menu' | 'playing' | 'levelup' | 'gameover';
