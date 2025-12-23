
export interface WordCluster {
  sortedLetters: string;
  words: string[];
}

export interface LevelData {
  rootLetters: string; // e.g. "ADEGL"
  displayLetters: string[]; // randomized, e.g. ["G", "L", "A", "D", "E"]
  validWords: string[]; // All words that can be formed
  foundWords: Set<string>;
}

export enum GameState {
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}
