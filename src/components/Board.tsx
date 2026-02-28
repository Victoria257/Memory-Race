import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Board = () => {
  const { gameState } = useStore();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 350 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // More compact height for rectangular layout
        const height = Math.max(180, width * 0.25);
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!gameState) return null;

  const cells = Array.from({ length: 30 }, (_, i) => i);

  // Calculate cell positions for a rectangular track
  const getCellPosition = (index: number) => {
    const { width, height } = dimensions;
    const isSmall = width < 500;
    const cellDiameter = isSmall ? 24 : 40;
    const maxGap = cellDiameter; // Gap between circles cannot exceed diameter
    const maxDist = cellDiameter + maxGap;
    
    const padding = isSmall ? 25 : 40;
    
    // Calculate the maximum width and height we want based on the gap rule
    // 13 cells top/bottom = 12 intervals
    // 2 cells side = 3 intervals (from corner to corner)
    const maxInnerWidth = 12 * maxDist;
    const maxInnerHeight = 3 * maxDist;
    
    const innerWidth = Math.min(width - padding * 2, maxInnerWidth);
    const innerHeight = Math.min(height - padding * 2, maxInnerHeight);
    
    // Centering offsets within the container
    const offsetX = (width - innerWidth) / 2;
    const offsetY = (height - innerHeight) / 2;
    
    // Distribution: 13 top, 2 right, 13 bottom, 2 left (Total 30)
    if (index <= 12) {
      // Top row (0-12)
      return {
        x: offsetX + (index / 12) * innerWidth,
        y: offsetY
      };
    } else if (index <= 14) {
      // Right column (13-14)
      const i = index - 12;
      return {
        x: offsetX + innerWidth,
        y: offsetY + (i / 3) * innerHeight
      };
    } else if (index <= 27) {
      // Bottom row (15-27)
      const i = index - 15;
      return {
        x: offsetX + innerWidth - (i / 12) * innerWidth,
        y: offsetY + innerHeight
      };
    } else {
      // Left column (28-29)
      const i = index - 27;
      return {
        x: offsetX,
        y: offsetY + innerHeight - (i / 3) * innerHeight
      };
    }
  };

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-400',
    yellow: 'bg-yellow-300',
    green: 'bg-green-400',
    purple: 'bg-purple-400',
    pink: 'bg-pink-400',
    orange: 'bg-orange-400'
  };

  return (
    <div 
      ref={containerRef}
      className="w-full bg-sky-100 p-4 rounded-3xl shadow-inner relative overflow-hidden transition-all duration-300 border-4 border-sky-200" 
      style={{ height: `${dimensions.height}px` }}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {cells.map((cell) => {
          const { x, y } = getCellPosition(cell);
          const isStart = cell === 0;
          const isFinish = cell === 29;
          const isSmall = dimensions.width < 500;
          
          return (
            <div
              key={cell}
              className={`absolute rounded-full flex items-center justify-center font-bold shadow-sm
                ${isStart ? (isSmall ? 'w-10 h-10 text-[10px]' : 'w-16 h-16 text-xs') + ' bg-blue-200 border-2 sm:border-4 border-blue-300 z-10' : 
                  isFinish ? (isSmall ? 'w-10 h-10 text-[10px]' : 'w-16 h-16 text-xs') + ' bg-red-200 border-2 sm:border-4 border-red-300 z-10' : 
                  (isSmall ? 'w-6 h-6 text-[8px]' : 'w-10 h-10 text-xs') + ' bg-white border-2 border-sky-100'}
              `}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {isStart ? '🚀' : isFinish ? '🏁' : cell}
            </div>
          );
        })}

        {gameState.players.map((player, idx) => {
          const { x, y } = getCellPosition(player.position);
          const isSmall = dimensions.width < 500;
          // Offset slightly if multiple players on same cell
          const offset = idx * (isSmall ? 3 : 5);
          
          return (
            <motion.div
              key={player.id}
              initial={{ left: x, top: y }}
              animate={{ left: x + offset, top: y + offset }}
              transition={{ type: 'spring', stiffness: 100, damping: 10 }}
              className={`absolute rounded-full shadow-lg border-2 border-white z-20 flex items-center justify-center font-bold ${isSmall ? 'w-5 h-5 text-[10px]' : 'w-8 h-8 text-[12px]'} ${tokenColors[player.tokenColor] || 'bg-gray-400'}`}
              style={{ transform: 'translate(-50%, -50%)' }}
              title={player.name}
            >
              {player.name.substring(0, 1).toUpperCase()}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
