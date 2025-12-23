
import React from 'react';
import { LevelData } from '../types';

interface CrosswordGridProps {
  level: LevelData;
  revealedIndices: Record<string, number[]>;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({ level, revealedIndices }) => {
  const { gridWidth, gridHeight, placedWords, foundWords } = level;

  // Create a flattened map for easier rendering: [y][x]
  const cellMap: (string | null)[][] = Array.from({ length: gridHeight }, () => 
    Array.from({ length: gridWidth }, () => null)
  );

  // Tracks if a cell is found or hinted
  const cellStatus: ('empty' | 'hidden' | 'found' | 'hinted')[][] = Array.from({ length: gridHeight }, () => 
    Array.from({ length: gridWidth }, () => 'empty')
  );

  placedWords.forEach(pw => {
    const isWordFound = foundWords.has(pw.word);
    const hints = revealedIndices[pw.word] || [];
    
    for (let i = 0; i < pw.word.length; i++) {
      const curX = pw.direction === 'horizontal' ? pw.x + i : pw.x;
      const curY = pw.direction === 'horizontal' ? pw.y : pw.y + i;
      const char = pw.word[i].toUpperCase();

      cellMap[curY][curX] = char;
      
      const currentStatus = cellStatus[curY][curX];
      if (isWordFound) {
        cellStatus[curY][curX] = 'found';
      } else if (hints.includes(i)) {
        if (currentStatus !== 'found') cellStatus[curY][curX] = 'hinted';
      } else {
        if (currentStatus === 'empty') cellStatus[curY][curX] = 'hidden';
      }
    }
  });

  // Calculate dynamic scaling
  const maxDim = Math.max(gridWidth, gridHeight);
  const cellSize = `min(${80 / maxDim}vw, ${320 / maxDim}px)`;

  return (
    <div 
      className="grid gap-1 mx-auto"
      style={{
        gridTemplateColumns: `repeat(${gridWidth}, ${cellSize})`,
        width: 'fit-content'
      }}
    >
      {cellMap.map((row, y) => (
        row.map((char, x) => {
          const status = cellStatus[y][x];
          if (status === 'empty') return <div key={`${x}-${y}`} style={{ width: cellSize, height: cellSize }} />;

          return (
            <div
              key={`${x}-${y}`}
              style={{ width: cellSize, height: cellSize }}
              className={`flex items-center justify-center rounded-sm text-[min(4vw,18px)] font-black transition-all duration-500 border
                ${status === 'found' 
                  ? 'bg-blue-600 border-blue-400 text-white animate-pop shadow-md shadow-blue-900/40' 
                  : status === 'hinted'
                    ? 'bg-slate-800 border-slate-700 text-blue-400/70'
                    : 'bg-slate-800/40 border-slate-800 text-transparent'}`}
            >
              {(status === 'found' || status === 'hinted') ? char : ''}
            </div>
          );
        })
      ))}
    </div>
  );
};

export default CrosswordGrid;
