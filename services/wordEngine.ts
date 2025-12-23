
import { WordCluster, LevelData } from '../types';

/**
 * WordEngine handles the dictionary processing and game logic.
 */
export class WordEngine {
  private clusters: Map<string, string[]> = new Map();
  private dictionary: string[] = [];
  private dictionarySet: Set<string> = new Set();

  // Words from literature and classic English that might be missed by modern frequency lists.
  // Removed 3-letter words like 'ere', 'thy', etc.
  private readonly PRIORITY_WORDS = [
    'nigh', 'fain', 'yore', 'lore', 'bard', 'sage', 'vale', 'moor', 'vial', 
    'helm', 'rune', 'mead', 'thou', 'thee', 'quoth', 'wrought', 'blithe', 
    'stark', 'grim', 'vane', 'reed'
  ];

  // Expanded blacklist to catch proper names, brands, technical terms, and fragments.
  private readonly BLACKLIST = new Set([
    // Proper Names & Brands
    'fran', 'brad', 'greg', 'ebay', 'sony', 'dell', 'nike', 'levi', 'visa', 'ford', 
    'fiat', 'asda', 'audi', 'hugo', 'marc', 'jean', 'paul', 'ivan', 'karl', 'erik',
    // Tech & Web jargon
    'http', 'html', 'www', 'com', 'org', 'blog', 'site', 'user', 'java', 'linux', 
    'unix', 'xml', 'json', 'wifi', 'apps', 'tech', 'data', 'file', 'link', 'code',
    'ipad', 'ipod', 'xbox', 'psn', 'bios', 'ping', 'pong', 'null', 'void',
    // Time fragments
    'july', 'june', 'sept', 'octo', 'nov', 'dec', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
    // Random noise/acronyms often found in 20k lists
    'vhs', 'dvd', 'usb', 'cpu', 'ram', 'pdf', 'mp3', 'url', 'api', 'sku', 'vat', 'gmt', 'pst',
    'abc', 'xyz', 'qrs', 'tuv', 'pqr', 'mno'
  ]);

  constructor() {}

  /**
   * Fetches a common English word list and processes it into clusters.
   */
  async init(): Promise<void> {
    try {
      const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt');
      if (!response.ok) throw new Error("Dictionary fetch failed");
      
      const text = await response.text();
      
      const fetchedWords = text.split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => {
          // Minimum length changed to 4
          const isCorrectLength = w.length >= 4 && w.length <= 7;
          const isAlpha = /^[a-z]+$/.test(w);
          const hasVowel = /[aeiouy]/.test(w);
          const isBlacklisted = this.BLACKLIST.has(w);
          
          return isCorrectLength && isAlpha && hasVowel && !isBlacklisted;
        });

      // Merge priority words with fetched words
      const combined = [...new Set([...fetchedWords, ...this.PRIORITY_WORDS])];

      // Populate dictionary and lookup set
      this.dictionary = combined;
      this.dictionarySet = new Set(this.dictionary);

      // Re-build clusters for fast sub-anagram lookup
      this.clusters.clear();
      this.dictionary.forEach(word => {
        const sorted = word.split('').sort().join('');
        if (!this.clusters.has(sorted)) {
          this.clusters.set(sorted, []);
        }
        this.clusters.get(sorted)!.push(word);
      });
      
      console.log(`WordEngine: Loaded ${this.dictionary.length} high-quality words (4-7 letters).`);
    } catch (error) {
      console.error("Failed to load dictionary, using robust fallback:", error);
      // Enhanced fallback list (removed 3-letter words)
      const fallback = [
        "rust", "trust", "star", "rats", "arts", "stair", "trail", "train",
        "react", "trace", "cater", "crate", "rate", "tear", "great", "gear", 
        "read", "dear", "dare", "care", "race", "rice", "word", "flow", "wolf", 
        "blue", "glow", "slow", "fast", "last", "past", "lake", "peak", "beam", 
        "team", "meat", "tame", "mate", "late", "tale", "nigh", "lore", "bard", 
        "sage", "vale", "moor"
      ];
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
    for (const char of bigSorted) {
      counts[char] = (counts[char] || 0) + 1;
    }
    for (const char of smallSorted) {
      if (!counts[char] || counts[char] === 0) return false;
      counts[char]--;
    }
    return true;
  }

  /**
   * Generates a level by picking a 5-7 letter root and finding sub-anagrams.
   */
  generateLevel(targetLength: number = 6): LevelData {
    let rootWords = this.dictionary.filter(w => w.length === targetLength);
    
    if (rootWords.length === 0) {
      targetLength = 5;
      rootWords = this.dictionary.filter(w => w.length === targetLength);
    }
    
    const randomRoot = rootWords[Math.floor(Math.random() * rootWords.length)] || "water";
    const rootSorted = randomRoot.split('').sort().join('');

    let allValid: string[] = [];
    for (const [sortedLetters, words] of this.clusters.entries()) {
      if (this.isSubset(sortedLetters, rootSorted)) {
        allValid.push(...words);
      }
    }

    let selectedWords: string[] = [];
    const maxWords = 12;

    if (allValid.length <= maxWords) {
      selectedWords = allValid;
    } else {
      const scoredWords = allValid.map(word => ({
        word,
        score: Math.pow(Math.random(), 1 / word.length)
      }));
      scoredWords.sort((a, b) => b.score - a.score);
      selectedWords = scoredWords.slice(0, maxWords).map(sw => sw.word);
    }

    selectedWords.sort((a, b) => a.length - b.length || a.localeCompare(b));

    const displayLetters = randomRoot.toUpperCase().split('');
    for (let i = displayLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [displayLetters[i], displayLetters[j]] = [displayLetters[j], displayLetters[i]];
    }

    return {
      rootLetters: rootSorted,
      displayLetters,
      validWords: selectedWords,
      foundWords: new Set<string>()
    };
  }
}

export const wordEngine = new WordEngine();
