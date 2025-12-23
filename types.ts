
export interface PlacedWord {
  word: string;
  x: number;
  y: number;
  direction: 'horizontal' | 'vertical';
}

export interface LevelData {
  rootLetters: string;
  displayLetters: string[];
  validWords: string[];
  placedWords: PlacedWord[];
  gridWidth: number;
  gridHeight: number;
  foundWords: Set<string>;
}

export enum GameState {
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}
