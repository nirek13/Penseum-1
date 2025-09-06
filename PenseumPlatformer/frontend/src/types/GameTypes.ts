export type GameState = 'start' | 'playing' | 'paused' | 'gameOver';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  question: string;
  answers: string[];
  correct: string;
  difficulty: Difficulty;
  subject: string;
  explanation: string;
  points: number;
}

export interface Player {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  lives: number;
  score: number;
  isJumping: boolean;
  isOnGround: boolean;
  hasShield: boolean;
  powerUps: PowerUp[];
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  answer: string;
  isCorrect: boolean;
  color: string;
  id: string;
}

export interface PowerUp {
  id: string;
  type: 'shield' | 'doubleBoost' | 'invincibility' | 'scoreMultiplier' | 'extraLife' | 'jetpack' | 'trampoline' | 'doubleJump';
  x: number;
  y: number;
  width: number;
  height: number;
  duration?: number;
  multiplier?: number;
  isActive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameStats {
  questionsAnswered: number;
  correctAnswers: number;
  lives: number;
  powerUpsUsed: number;
  gameMode: string;
  difficulty: string;
  accuracy: number;
}

export interface ScoreData {
  id: string;
  playerName: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  lives: number;
  powerUpsUsed: number;
  gameMode: string;
  difficulty: string;
  timestamp: string;
  accuracy: number;
}

export interface GameConfig {
  gravity: number;
  jumpPower: number;
  playerSpeed: number;
  platformWidth: number;
  platformHeight: number;
  maxLives: number;
  boostHeight: number;
  screenWidth: number;
  screenHeight: number;
}