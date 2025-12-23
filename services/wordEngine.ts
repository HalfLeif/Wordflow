
import { LevelData, PlacedWord } from '../types.ts';

export class WordEngine {
  private clusters: Map<string, string[]> = new Map();
  private dictionary: string[] = [];
  private dictionarySet: Set<string> = new Set();

  private readonly PRIORITY_WORDS = [
    'nigh', 'fain', 'yore', 'lore', 'bard', 'sage', 'vale', 'moor', 'vial', 
    'helm', 'rune', 'mead', 'thou', 'thee', 'quoth', 'wrought', 'blithe', 
    'stark', 'grim', 'vane', 'reed'
  ];

  private readonly BLACKLIST = new Set([
    'fran', 'brad', 'greg', 'ebay', 'sony', 'dell', 'nike', 'levi', 'visa', 'ford', 
    'fiat', 'asda', 'audi', 'hugo', 'marc', 'jean', 'paul', 'ivan', 'karl', 'erik',
    'http', 'html', 'www', 'com', 'org', 'blog', 'site', 'user', 'java', 'linux', 
    'unix', 'xml', 'json', 'wifi', 'apps', 'tech', 'data', 'file', 'link', 'code',
    'ipad', 'ipod', 'xbox', 'psn', 'bios', 'ping', 'pong', 'null', 'void',
    'july', 'june', 'sept', 'octo', 'nov', 'dec', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  ]);

  constructor() {}

  async init(): Promise<void> {
    console.info("📚 WordEngine: Starting initialization...");
    try {
      console.log("📚 WordEngine: Fetching dictionary from remote source...");
      const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt');
      if (!response.ok) throw new Error(`Dictionary fetch failed with status ${response.status}`);
      
      const text = await response.text();
      console.log(`📚 WordEngine: Received dictionary data (${Math.round(text.length / 1024)} KB)`);
      
      const fetchedWords = text.split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => {
          const isCorrectLength = w.length >= 4 && w.length <= 7;
          const isAlpha = /^[a-z]+$/.test(w);
          const hasVowel = /[aeiouy]/.test(w);
          return isCorrectLength && isAlpha && hasVowel && !this.BLACKLIST.has(w);
        });

      const combined = [...new Set([...fetchedWords, ...this.PRIORITY_WORDS])];
      this.dictionary = combined;
      this.dictionarySet = new Set(this.dictionary);
      console.info(`📚 WordEngine: Dictionary processed. ${this.dictionary.length} valid words found.`);

      this.clusters.clear();
      this.dictionary.forEach(word => {
        const sorted = word.split('').sort().join('');
        if (!this.clusters.has(sorted)) this.clusters.set(sorted, []);
        this.clusters.get(sorted)!.push(word);
      });
      console.info(`📚 WordEngine: Word clusters built. ${this.clusters.size} unique character combinations.`);

    } catch (error) {
      console.error("❌ WordEngine: Init error, using fallback dictionary", error);
      const fallback = ["rust", "trust", "star", "stair", "trail", "train", "react", "trace", "cater", "crate", "great", "gear", "read", "dear", "care", "race", "word", "flow", "wolf", "blue", "glow", "slow", "fast", "lake", "peak", "beam", "team", "nigh", "lore", "bard", "sage"];
      this.dictionary = fallback;
      this.dictionarySet = new Set(fallback);
      fallback.forEach(word => {
        const sorted = word.split('').sort().join('');
        if (!this.clusters.has(sorted)) this.clusters.set(sorted, []);
        this.clusters.get(sorted)!.push(word);
      });
    }
  }

  isValidWord(word: string): boolean {
    return this.dictionarySet.has(word.toLowerCase());
  }

  private isSubset(smallSorted: string, bigSorted: string): boolean {
    const counts: Record<string, number> = {};
    for (const char of bigSorted) counts[char] = (counts[char] || 0) + 1;
    for (const char of smallSorted) {
      if (!counts[char] || counts[char] === 0) return false;
      counts[char]--;
    }
    return true;
  }

  generateLevel(targetLength: number = 6): LevelData {
    console.log(`🏗️ WordEngine: Generating level for length ${targetLength}...`);
    let rootWords = this.dictionary.filter(w => w.length === targetLength);
    if (rootWords.length === 0) {
      console.warn(`🏗️ WordEngine: No words of length ${targetLength} found. Falling back to 5.`);
      targetLength = 5;
      rootWords = this.dictionary.filter(w => w.length === targetLength);
    }
    
    const randomRoot = rootWords[Math.floor(Math.random() * rootWords.length)] || "water";
    const rootSorted = randomRoot.split('').sort().join('');
    console.log(`🏗️ WordEngine: Root word selected: "${randomRoot}"`);

    let pool: string[] = [];
    for (const [sortedLetters, words] of this.clusters.entries()) {
      if (this.isSubset(sortedLetters, rootSorted)) {
        pool.push(...words);
      }
    }
    console.log(`🏗️ WordEngine: Found ${pool.length} candidate words for this root.`);

    const weightedPool = pool.map(word => ({
      word,
      score: Math.pow(Math.random(), 1 / word.length)
    })).sort((a, b) => b.score - a.score).map(p => p.word);

    const placed: PlacedWord[] = [];
    const grid: Map<string, string> = new Map();
    const cellToWords: Map<string, string[]> = new Map();

    const canPlace = (word: string, x: number, y: number, dir: 'horizontal' | 'vertical', intersectionX: number, intersectionY: number): boolean => {
      for (let i = 0; i < word.length; i++) {
        const curX = dir === 'horizontal' ? x + i : x;
        const curY = dir === 'horizontal' ? y : y + i;
        const char = word[i];
        const key = `${curX},${curY}`;

        const existing = grid.get(key);
        if (existing) {
          if (existing !== char) return false; 
          const wordsAtCell = cellToWords.get(key) || [];
          if (wordsAtCell.length >= 2) return false; 
          if (curX !== intersectionX || curY !== intersectionY) return false;
        }

        const isIntersectionCell = (curX === intersectionX && curY === intersectionY);
        const adjacents = [
          { x: curX - 1, y: curY, label: 'left' },
          { x: curX + 1, y: curY, label: 'right' },
          { x: curX, y: curY - 1, label: 'up' },
          { x: curX, y: curY + 1, label: 'down' }
        ];

        for (const adj of adjacents) {
          const adjKey = `${adj.x},${adj.y}`;
          if (grid.has(adjKey)) {
            const isWordFlow = (dir === 'horizontal' && (adj.label === 'left' || adj.label === 'right')) ||
                               (dir === 'vertical' && (adj.label === 'up' || adj.label === 'down'));
            if (isWordFlow) {
              if (i === 0 && adj.label === 'left') return false;
              if (i === word.length - 1 && adj.label === 'right') return false;
              if (dir === 'vertical') {
                if (i === 0 && adj.label === 'up') return false;
                if (i === word.length - 1 && adj.label === 'down') return false;
              }
            } else {
              if (!isIntersectionCell) return false;
            }
          }
        }
      }
      return true;
    };

    const place = (word: string, x: number, y: number, dir: 'horizontal' | 'vertical') => {
      placed.push({ word, x, y, direction: dir });
      for (let i = 0; i < word.length; i++) {
        const curX = dir === 'horizontal' ? x + i : x;
        const curY = dir === 'horizontal' ? y : y + i;
        const key = `${curX},${curY}`;
        grid.set(key, word[i]);
        if (!cellToWords.has(key)) cellToWords.set(key, []);
        cellToWords.get(key)!.push(word);
      }
    };

    const firstWord = weightedPool.find(w => w.length === randomRoot.length) || weightedPool[0];
    place(firstWord, 0, 0, 'horizontal');

    let attempts = 0;
    while (placed.length < 12 && attempts < weightedPool.length * 10) {
      const candidate = weightedPool[attempts % weightedPool.length];
      attempts++;
      if (placed.some(p => p.word === candidate)) continue;

      let bestFit: { x: number, y: number, dir: 'horizontal' | 'vertical', ix: number, iy: number } | null = null;
      for (const p of placed) {
        for (let i = 0; i < p.word.length; i++) {
          for (let j = 0; j < candidate.length; j++) {
            if (p.word[i] === candidate[j]) {
              const dir: 'horizontal' | 'vertical' = p.direction === 'horizontal' ? 'vertical' : 'horizontal';
              const x = p.direction === 'horizontal' ? p.x + i : p.x - j;
              const y = p.direction === 'horizontal' ? p.y - j : p.y + i;
              const ix = p.direction === 'horizontal' ? p.x + i : p.x;
              const iy = p.direction === 'horizontal' ? p.y : p.y + i;
              if (canPlace(candidate, x, y, dir, ix, iy)) {
                bestFit = { x, y, dir, ix, iy };
                break;
              }
            }
          }
          if (bestFit) break;
        }
        if (bestFit) break;
      }
      if (bestFit) place(candidate, bestFit.x, bestFit.y, bestFit.dir);
    }

    console.log(`🏗️ WordEngine: Crossword layout built with ${placed.length} words.`);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    placed.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      const endX = p.direction === 'horizontal' ? p.x + p.word.length - 1 : p.x;
      const endY = p.direction === 'vertical' ? p.y + p.word.length - 1 : p.y;
      maxX = Math.max(maxX, endX);
      maxY = Math.max(maxY, endY);
    });

    const finalPlaced = placed.map(p => ({
      ...p,
      x: p.x - minX,
      y: p.y - minY
    }));

    const displayLetters = randomRoot.toUpperCase().split('').sort(() => Math.random() - 0.5);

    return {
      rootLetters: rootSorted,
      displayLetters,
      validWords: finalPlaced.map(p => p.word),
      placedWords: finalPlaced,
      gridWidth: maxX - minX + 1,
      gridHeight: maxY - minY + 1,
      foundWords: new Set<string>()
    };
  }
}

export const wordEngine = new WordEngine();
