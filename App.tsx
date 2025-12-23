
import React, { useState, useEffect } from 'react';
import { wordEngine } from './services/wordEngine';
import { LevelData, GameState } from './types';
import LetterWheel from './components/LetterWheel';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [levelNumber, setLevelNumber] = useState(1);
  const [isSkipped, setIsSkipped] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const initGame = async () => {
      await wordEngine.init();
      loadNewLevel(6);
    };
    initGame();
  }, []);

  const loadNewLevel = (length: number) => {
    const nextLevelData = wordEngine.generateLevel(length);
    setLevel(nextLevelData);
    setRevealedIndices({});
    setGameState(GameState.PLAYING);
    setMessage("");
    setIsSkipped(false);
  };

  const isPossibleWithLetters = (word: string, rootLetters: string): boolean => {
    const counts: Record<string, number> = {};
    for (const char of rootLetters) counts[char] = (counts[char] || 0) + 1;
    for (const char of word) {
      if (!counts[char]) return false;
      counts[char]--;
    }
    return true;
  };

  const handleWordComplete = (word: string) => {
    if (!level) return;

    if (word.length < 4) {
      if (word.length > 0) showTemporaryMessage("Too short!");
      return;
    }

    if (level.foundWords.has(word)) {
      showTemporaryMessage("Already found!");
      return;
    }

    if (level.validWords.includes(word)) {
      const updatedFound = new Set(level.foundWords);
      updatedFound.add(word);
      
      const newLevel = { ...level, foundWords: updatedFound };
      setLevel(newLevel);
      setScore(prev => prev + word.length * 10);
      showTemporaryMessage("Great!", true);

      if (updatedFound.size === level.validWords.length) {
        setGameState(GameState.LEVEL_COMPLETE);
      }
    } else {
      const isEnglishWord = wordEngine.isValidWord(word);
      const possibleWithLetters = isPossibleWithLetters(word, level.rootLetters);

      if (isEnglishWord && possibleWithLetters) {
        showTemporaryMessage("Valid, but not in this puzzle!");
      } else if (isEnglishWord && !possibleWithLetters) {
        showTemporaryMessage("Wrong letters!");
      } else {
        showTemporaryMessage("Not a word!");
      }
    }
  };

  const handleHelp = () => {
    if (!level || gameState !== GameState.PLAYING) return;

    const unfoundWords = level.validWords.filter(w => !level.foundWords.has(w));
    if (unfoundWords.length === 0) return;

    const availableWords = unfoundWords.filter(word => {
      const revealed = revealedIndices[word] || [];
      return revealed.length < word.length;
    });

    if (availableWords.length === 0) return;

    const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    const revealed = revealedIndices[targetWord] || [];
    const hiddenIndices = [];
    for (let i = 0; i < targetWord.length; i++) {
      if (!revealed.includes(i)) hiddenIndices.push(i);
    }

    if (hiddenIndices.length > 0) {
      const newIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
      setRevealedIndices(prev => ({
        ...prev,
        [targetWord]: [...(prev[targetWord] || []), newIndex]
      }));
      setScore(prev => Math.max(0, prev - 20));
    }
  };

  const handleGiveUp = () => {
    if (!level || gameState !== GameState.PLAYING) return;
    setIsSkipped(true);
    const allFound = new Set(level.validWords);
    setLevel({ ...level, foundWords: allFound });
    showTemporaryMessage("Words revealed!");
    setTimeout(() => {
      setGameState(GameState.LEVEL_COMPLETE);
    }, 1500);
  };

  const showTemporaryMessage = (msg: string, isPositive: boolean = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const nextLevel = () => {
    if (!isSkipped) {
      setLevelNumber(prev => prev + 1);
    }
    const nextLen = Math.min(7, Math.max(5, (level?.rootLetters.length || 5) + (Math.random() > 0.6 ? 1 : 0)));
    loadNewLevel(nextLen);
  };

  const renderWord = (word: string) => {
    const isFound = level?.foundWords.has(word);
    const revealed = revealedIndices[word] || [];

    return word.split('').map((char, i) => {
      const isRevealed = isFound || revealed.includes(i);
      return (
        <span key={i} className={isRevealed ? "" : "opacity-20"}>
          {isRevealed ? char.toUpperCase() : "•"}
        </span>
      );
    });
  };

  if (gameState === GameState.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-2xl font-bold tracking-tight">WordFlow</h1>
        <p className="text-slate-400 mt-2 text-sm">Building dictionary...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden safe-top safe-bottom select-none">
      {/* Compact Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800/50">
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tighter text-blue-400 leading-tight">WORDFLOW</h1>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider border border-blue-500/20 uppercase">
              LEVEL {levelNumber}
            </span>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Puzzle</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Score</p>
          <p className="text-xl font-black text-blue-500 leading-none">{score}</p>
        </div>
      </div>

      {/* Primary Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        <div className="max-w-md mx-auto">
          {level && Array.from({ length: 4 }).map((_, lenIdx) => {
            const currentLen = lenIdx + 4; // Starts from 4 letters now
            const wordsOfLen = level.validWords.filter(w => w.length === currentLen);
            if (wordsOfLen.length === 0) return null;

            return (
              <div key={currentLen} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-px flex-1 bg-slate-800"></div>
                   <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                    {currentLen} LETTERS • {wordsOfLen.filter(w => level.foundWords.has(w)).length}/{wordsOfLen.length}
                  </h3>
                   <div className="h-px flex-1 bg-slate-800"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {wordsOfLen.map((word, idx) => {
                    const isFound = level.foundWords.has(word);
                    const hasHints = (revealedIndices[word] || []).length > 0;
                    return (
                      <div
                        key={idx}
                        className={`h-8 px-1.5 flex items-center justify-center rounded-md font-bold border transition-all duration-500
                          ${isFound 
                            ? 'bg-blue-600 border-blue-400 text-white animate-pop shadow-lg shadow-blue-900/20' 
                            : hasHints
                              ? 'bg-slate-800 border-slate-600 text-slate-300'
                              : 'bg-slate-800/50 border-slate-800/50 text-transparent'}`}
                      >
                        <span className="tracking-[0.15em] flex gap-0.5 text-sm">
                          {renderWord(word)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Word Display - Tightened */}
      <div className="h-12 flex flex-col items-center justify-center shrink-0">
        <div className={`text-2xl font-black tracking-[0.2em] uppercase transition-all duration-150 transform
          ${currentGuess ? 'text-blue-400 scale-105' : 'text-slate-800 scale-100'}
        `}>
          {currentGuess || "••••"}
        </div>
      </div>

      {/* Interaction Area - Centered & Responsive */}
      <div className="flex flex-col items-center pb-6 shrink-0 relative">
        <div className="w-full max-w-[min(90vw,340px)] flex justify-between items-center mb-2 px-2">
          <button 
            onClick={handleHelp}
            disabled={gameState !== GameState.PLAYING}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow active:scale-90 transition-transform disabled:opacity-50"
          >
            <span className="text-lg">💡</span>
          </button>

          <div className="flex-1 px-4 flex items-center justify-center">
            {message && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black animate-pop bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest text-center`}>
                {message}
              </span>
            )}
          </div>

          <button 
            onClick={handleGiveUp}
            disabled={gameState !== GameState.PLAYING}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow active:scale-90 transition-transform disabled:opacity-50"
          >
            <span className="text-lg">🏳️</span>
          </button>
        </div>

        {level && (
          <LetterWheel
            letters={level.displayLetters}
            currentWord={currentGuess}
            setCurrentWord={setCurrentGuess}
            onWordComplete={handleWordComplete}
          />
        )}
      </div>

      {/* Level Complete Modal */}
      {gameState === GameState.LEVEL_COMPLETE && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-8 max-w-[300px] w-full text-center shadow-2xl animate-pop">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/40">
              <span className="text-3xl">{isSkipped ? "🏳️" : "✨"}</span>
            </div>
            <h2 className="text-2xl font-black mb-1 text-white uppercase tracking-tight">
              {isSkipped ? "REVEALED" : "LEVEL UP!"}
            </h2>
            <p className="text-slate-400 mb-6 text-sm font-medium">
              {isSkipped ? "Try the next one!" : "Ready for the next challenge?"}
            </p>
            <button
              onClick={nextLevel}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-lg shadow-lg transition-all active:scale-95 active:shadow-none"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
