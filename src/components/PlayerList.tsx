import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Bell, Clock, Flag } from 'lucide-react';

export const PlayerList = () => {
  const { gameState, playerId, ringBell, giveUp } = useStore();
  const [timeSinceTurnStart, setTimeSinceTurnStart] = useState(0);

  if (!gameState) return null;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.status === 'playing') {
      interval = setInterval(() => {
        setTimeSinceTurnStart(Date.now() - gameState.turnStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.turnStartTime, gameState.status]);

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    white: 'bg-white border border-gray-300',
    orange: 'bg-orange-500'
  };

  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === playerId;
  const showBell = !isMyTurn && timeSinceTurnStart > 30000;
  const anyPlayerFinished = gameState.players.some(p => p.place !== null);
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const canGiveUp = anyPlayerFinished && myPlayer && myPlayer.place === null;

  return (
    <div className="w-full bg-[#F1F8E9]/80 backdrop-blur-sm shadow-md rounded-xl p-4 sm:p-6 mb-0 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b sm:border-b-0 border-[#7DA33C]/20">
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 w-full sm:w-auto scrollbar-hide">
        {gameState.players.map((player, idx) => {
          const isCurrentTurn = idx === gameState.currentTurnIndex;
          
          return (
            <div 
              key={player.id}
              className={`flex flex-col items-center p-2 rounded-lg min-w-[100px] transition-all
                ${isCurrentTurn ? 'bg-green-100 border-2 border-green-400 shadow-sm scale-105' : 'bg-white/30 border border-green-200 opacity-80'}
                ${player.place !== null ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="relative mb-2">
                <div className={`w-10 h-10 rounded-full shadow-inner ${tokenColors[player.tokenColor]}`}></div>
                {player.place !== null && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {player.place}
                  </div>
                )}
                {player.skipNextTurn && (
                  <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded shadow-sm">
                    ПРОПУСК
                  </div>
                )}
                {!player.connected && (
                  <div className="absolute -bottom-2 -left-2 bg-gray-500 text-white text-[10px] font-bold px-1 rounded shadow-sm">
                    OFF
                  </div>
                )}
              </div>
              
              <span className="text-sm font-bold text-green-900 truncate w-full text-center">
                {player.name} {player.id === playerId ? '(Ви)' : ''}
              </span>
              
              {isCurrentTurn && (
                <div className="flex items-center gap-1 text-xs text-green-700 font-bold mt-1">
                  <Clock size={12} />
                  <span>{Math.floor(timeSinceTurnStart / 1000)}с</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 ml-0 sm:ml-4 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 border-green-200 w-full sm:w-auto">
        {showBell && (
          <button 
            onClick={() => ringBell(gameState.players[gameState.currentTurnIndex].id)}
            className="flex items-center justify-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition font-bold text-sm shadow-sm"
          >
            <Bell size={16} className="animate-bounce" /> Дзвіночок
          </button>
        )}

        {canGiveUp && (
          <button 
            onClick={giveUp}
            className="flex items-center justify-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition font-bold text-sm shadow-sm"
          >
            <Flag size={16} /> Здаюсь
          </button>
        )}
      </div>
    </div>
  );
};
