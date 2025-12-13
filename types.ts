
export type ThemeId = 'classic' | 'hockey' | 'football' | 'space';
export type Operation = 'multiplication' | 'addition' | 'subtraction' | 'division' | 'percentage' | 'exponentiation' | 'algebra' | 'root';

export type GradeLevel = 'F' | '1' | '2' | '3' | '4-6' | '7-9';

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

export type GamePhase = 'grade_selection' | 'menu' | 'playing' | 'levelup' | 'gameover';