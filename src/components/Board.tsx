import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { Building2, FerrisWheel, Trees, Building, Car } from 'lucide-react';

export const Board = () => {
  const { gameState } = useStore();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 350 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // If height is 0 (not yet rendered or container has no height), 
        // fallback to a reasonable aspect ratio
        const finalHeight = height > 0 ? height : Math.max(250, width * 0.5);
        setDimensions({ width, height: finalHeight });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!gameState) return null;

  const cells = Array.from({ length: 21 }, (_, i) => i);

  // Path coordinates (0-100 scale) - Optimized for a snake-like winding path
  const pathPoints = [
    { x: 10, y: 80 },  // 0: Start
    { x: 22, y: 85 },  // 1
    { x: 35, y: 82 },  // 2
    { x: 42, y: 70 },  // 3
    { x: 38, y: 55 },  // 4
    { x: 28, y: 45 },  // 5
    { x: 18, y: 35 },  // 6
    { x: 12, y: 22 },  // 7
    { x: 22, y: 12 },  // 8
    { x: 38, y: 10 },  // 9
    { x: 55, y: 12 },  // 10
    { x: 68, y: 22 },  // 11
    { x: 75, y: 38 },  // 12
    { x: 70, y: 55 },  // 13
    { x: 58, y: 65 },  // 14
    { x: 45, y: 75 },  // 15
    { x: 52, y: 88 },  // 16
    { x: 68, y: 92 },  // 17
    { x: 82, y: 85 },  // 18
    { x: 92, y: 70 },  // 19
    { x: 90, y: 45 },  // 20: Finish
  ];

  const getCellPosition = (index: number) => {
    const { width, height } = dimensions;
    const point = pathPoints[Math.min(index, pathPoints.length - 1)];
    
    return {
      x: (point.x / 100) * width,
      y: (point.y / 100) * height
    };
  };

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-400',
    yellow: 'bg-yellow-300',
    green: 'bg-green-400',
    purple: 'bg-purple-400',
    pink: 'bg-pink-400',
    orange: 'bg-orange-400'
  };

  // Generate SVG path string
  const generatePath = () => {
    if (pathPoints.length === 0) return '';
    const { width, height } = dimensions;
    return pathPoints.reduce((acc, p, i) => {
      const x = (p.x / 100) * width;
      const y = (p.y / 100) * height;
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#97C14D] p-4 rounded-none desktop:rounded-3xl shadow-inner relative overflow-hidden transition-all duration-300 border-8 border-[#7DA33C]" 
    >
      {/* Decorative elements */}
      <div className="absolute top-4 left-4 text-green-800 opacity-40"><Building2 size={48} /></div>
      <div className="absolute top-10 right-10 text-green-800 opacity-40"><FerrisWheel size={64} /></div>
      <div className="absolute bottom-10 left-20 text-green-800 opacity-40"><Trees size={40} /></div>
      <div className="absolute bottom-4 right-4 text-green-800 opacity-40"><Building size={48} /></div>
      <div className="absolute top-1/2 left-1/4 text-green-800 opacity-20"><Car size={32} /></div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Draw path line - The "Snake" Road */}
        <svg className="absolute top-0 left-0 w-full h-full">
          {/* Road shadow/border */}
          <path
            d={generatePath()}
            fill="none"
            stroke="#7A7A7A"
            strokeWidth={dimensions.width < 500 ? 30 : 60}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Road surface */}
          <path
            d={generatePath()}
            fill="none"
            stroke="#9E9E9E"
            strokeWidth={dimensions.width < 500 ? 26 : 54}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Road center line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeDasharray="10,15"
            className="opacity-40"
          />
        </svg>

        {cells.map((cell) => {
          const { x, y } = getCellPosition(cell);
          const isStart = cell === 0;
          const isFinish = cell === 20;
          const isSmall = dimensions.width < 500;
          
          return (
            <div
              key={cell}
              className={`absolute rounded-full flex flex-col items-center justify-center font-bold shadow-md transition-all
                ${isStart ? (isSmall ? 'w-12 h-12 text-[8px]' : 'w-20 h-20 text-[10px]') + ' bg-[#555] text-white border-4 border-[#333] z-10' : 
                  isFinish ? (isSmall ? 'w-12 h-12 text-[8px]' : 'w-20 h-20 text-[10px]') + ' bg-[#555] text-white border-4 border-[#333] z-10' : 
                  (isSmall ? 'w-8 h-8 text-[10px]' : 'w-12 h-12 text-sm') + ' bg-[#D9D9D9] text-[#333] border-2 border-[#999]'}
              `}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <span className={isStart || isFinish ? "uppercase" : ""}>
                {isStart ? 'Старт' : isFinish ? 'Фініш' : cell}
              </span>
              {isStart && <Car className="mt-1 text-red-500" size={isSmall ? 12 : 18} />}
              {isFinish && <Building className="mt-1 text-blue-500" size={isSmall ? 12 : 18} />}
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
