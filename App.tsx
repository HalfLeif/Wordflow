
import React, { useState, useEffect } from 'react';
import { wordEngine } from './services/wordEngine.ts';
import { LevelData, GameState } from './types.ts';
import LetterWheel from './components/LetterWheel.tsx';
import CrosswordGrid from './components/CrosswordGrid.tsx';

const App: React.FC = () => {
  console.log("⚛️ App: Component function called (Render)");
  
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [currentGuess, setCurrentGuess] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [levelNumber, setLevelNumber] = useState(1);
  const [isSkipped, setIsSkipped] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Record<string, number[]>>({});

  useEffect(() => {
    console.info("⚛️ App: Mounting (useEffect)");
    const initGame = async () => {
      console.info("🎮 App: Initializing WordEngine...");
      try {
        await wordEngine.init();
        console.info("🎮 App: WordEngine initialized. Loading first level...");
        loadNewLevel(6);
      } catch (err) {
        console.error("❌ App: Failed to initialize WordEngine:", err);
      }
    };
    initGame();
  }, []);

  const loadNewLevel = (length: number) => {
    console.info(`🎮 App: Generating new level with length: ${length}`);
    const nextLevelData = wordEngine.generateLevel(length);
    console.info("🎮 App: Level generation complete", {
      root: nextLevelData.rootLetters,
      words: nextLevelData.validWords.length
    });
    setLevel(nextLevelData);
    setRevealedIndices({});
    setGameState(GameState.PLAYING);
    setMessage("");
    setIsSkipped(false);
  };

  const handleWordComplete = (word: string) => {
    if (!level || gameState !== GameState.PLAYING) return;
    console.log(`🎯 App: User submitted word: "${word}"`);

    if (word.length < 4) {
      if (word.length > 0) showTemporaryMessage("Too short!");
      return;
    }

    if (level.foundWords.has(word)) {
      showTemporaryMessage("Already found!");
      return;
    }

    if (level.validWords.includes(word)) {
      console.info(`🎯 App: Correct guess! "${word}"`);
      const updatedFound = new Set(level.foundWords);
      updatedFound.add(word);
      
      const newLevel = { ...level, foundWords: updatedFound };
      setLevel(newLevel);
      setScore(prev => prev + word.length * 10);
      showTemporaryMessage("Great!", true);

      if (updatedFound.size === level.validWords.length) {
        console.info("🎉 App: Level complete!");
        setGameState(GameState.LEVEL_COMPLETE);
      }
    } else {
      if (wordEngine.isValidWord(word)) {
        showTemporaryMessage("Valid word, but not here!");
      } else {
        showTemporaryMessage("Not a word!");
      }
    }
  };

  const handleHelp = () => {
    if (!level || gameState !== GameState.PLAYING) return;
    console.log("💡 App: Hint requested");

    const hiddenCells: { x: number, y: number }[] = [];
    const visibleCoords = new Set<string>();
    
    level.placedWords.forEach(pw => {
      const isFound = level.foundWords.has(pw.word);
      const hints = revealedIndices[pw.word] || [];
      for (let i = 0; i < pw.word.length; i++) {
        const cx = pw.direction === 'horizontal' ? pw.x + i : pw.x;
        const cy = pw.direction === 'horizontal' ? pw.y : pw.y + i;
        if (isFound || hints.includes(i)) {
          visibleCoords.add(`${cx},${cy}`);
        }
      }
    });

    level.placedWords.forEach(pw => {
      for (let i = 0; i < pw.word.length; i++) {
        const cx = pw.direction === 'horizontal' ? pw.x + i : pw.x;
        const cy = pw.direction === 'horizontal' ? pw.y : pw.y + i;
        const key = `${cx},${cy}`;
        if (!visibleCoords.has(key)) {
          if (!hiddenCells.some(c => c.x === cx && c.y === cy)) {
            hiddenCells.push({ x: cx, y: cy });
          }
        }
      }
    });

    if (hiddenCells.length === 0) return;

    const target = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
    setRevealedIndices(prev => {
      const next = { ...prev };
      level.placedWords.forEach(pw => {
        for (let i = 0; i < pw.word.length; i++) {
          const cx = pw.direction === 'horizontal' ? pw.x + i : pw.x;
          const cy = pw.direction === 'horizontal' ? pw.y : pw.y + i;
          if (cx === target.x && cy === target.y) {
            next[pw.word] = [...(next[pw.word] || []), i];
          }
        }
      });
      return next;
    });

    setScore(prev => Math.max(0, prev - 20));
  };

  const handleGiveUp = () => {
    if (!level || gameState !== GameState.PLAYING) return;
    setIsSkipped(true);
    const allFound = new Set(level.validWords);
    setLevel({ ...level, foundWords: allFound });
    setGameState(GameState.LEVEL_COMPLETE);
    showTemporaryMessage("Words revealed!");
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

  if (gameState === GameState.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-2xl font-bold tracking-tight">WordFlow</h1>
        <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-bold">Building Puzzle...</p>
      </div>
    );
  }

  const isLevelFinished = gameState === GameState.LEVEL_COMPLETE;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden safe-top safe-bottom select-none">
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800/50 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-blue-400 leading-none">WORDFLOW</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider border border-blue-500/20 uppercase">
              LEVEL {levelNumber}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Score</p>
          <p className="text-2xl font-black text-blue-500 leading-none">{score}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {level && <CrosswordGrid level={level} revealedIndices={revealedIndices} />}
        
        {isLevelFinished && !message && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 animate-pop">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black bg-blue-600 shadow-xl shadow-blue-900/40 text-white border border-blue-400 uppercase tracking-[0.2em]`}>
              {isSkipped ? "WORDS REVEALED" : "LEVEL COMPLETE!"}
            </span>
          </div>
        )}
      </div>

      <div className="h-14 flex flex-col items-center justify-center shrink-0">
        {!isLevelFinished ? (
          <div className={`text-2xl font-black tracking-[0.2em] uppercase transition-all duration-150 transform
            ${currentGuess ? 'text-blue-400 scale-110' : 'text-slate-800 scale-100'}
          `}>
            {currentGuess || "••••"}
          </div>
        ) : (
          <div className="text-blue-400/50 text-xs font-black uppercase tracking-widest animate-pulse">
            {isSkipped ? "TAP BELOW FOR NEXT" : "EXCELLENT WORK"}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center pb-8 shrink-0 relative">
        {!isLevelFinished && (
          <div className="w-full max-w-[min(90vw,340px)] flex justify-between items-center mb-4 px-2">
            <button 
              onClick={handleHelp}
              className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <span className="text-xl">💡</span>
            </button>

            <div className="flex-1 px-4 flex items-center justify-center min-h-[24px]">
              {message && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black animate-pop bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest text-center">
                  {message}
                </span>
              )}
            </div>

            <button 
              onClick={handleGiveUp}
              className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <span className="text-xl">🏳️</span>
            </button>
          </div>
        )}

        <div className="w-full max-w-[min(90vw,340px)] min-h-[280px] flex items-center justify-center">
          {isLevelFinished ? (
            <div className="w-full animate-pop flex flex-col items-center">
              <button
                onClick={nextLevel}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[2rem] text-2xl shadow-2xl shadow-blue-500/30 transition-all active:scale-95 active:shadow-none uppercase tracking-tighter"
              >
                Continue
              </button>
            </div>
          ) : (
            level && (
              <LetterWheel
                letters={level.displayLetters}
                currentWord={currentGuess}
                setCurrentWord={setCurrentGuess}
                onWordComplete={handleWordComplete}
              />
            )
          )}
        </div>
      </div>
      
      {/* Spacer for debug console */}
      <div className="h-[120px] shrink-0 pointer-events-none opacity-0"></div>
    </div>
  );
};

export default App;
