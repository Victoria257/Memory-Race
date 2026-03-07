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
    <div className="w-full tablet-l:w-48 bg-[#3A5214] backdrop-blur-sm shadow-md rounded-xl tablet-l:rounded-3xl p-4 tablet-p:p-6 mb-0 tablet-p:mb-6 flex flex-col tablet-l:flex-col items-center justify-between tablet-l:justify-start gap-4 border-b tablet-l:border-b-0 tablet-l:border-l border-[#7DA33C]/40 tablet-l:h-full tablet-l:overflow-y-auto">
      <h3 className="hidden tablet-l:block text-xs font-black text-green-300 uppercase tracking-widest mb-2">Гравці</h3>
      <div className="flex tablet-l:flex-col gap-4 overflow-x-auto tablet-l:overflow-x-visible pb-2 tablet-l:pb-0 pt-2 px-2 w-full scrollbar-hide">
        {gameState.players.map((player, idx) => {
          const isCurrentTurn = idx === gameState.currentTurnIndex;
          
          return (
            <div 
              key={player.id}
              className={`flex flex-col tablet-l:flex-row items-center tablet-l:items-center p-2 tablet-l:p-3 rounded-xl min-w-[100px] tablet-l:min-w-0 tablet-l:w-full transition-all gap-2
                ${isCurrentTurn ? 'bg-green-800 border-2 border-yellow-400 shadow-sm scale-105 z-10' : 'bg-green-900/40 border border-green-700/50 opacity-80'}
                ${player.place !== null ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 tablet-l:w-12 tablet-l:h-12 rounded-full shadow-inner ${tokenColors[player.tokenColor]}`}></div>
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
              
              <div className="flex flex-col items-center tablet-l:items-start min-w-0 flex-1">
                <span className="text-sm font-bold text-green-50 truncate w-full text-center tablet-l:text-left">
                  {player.name} {player.id === playerId ? '(Ви)' : ''}
                </span>
                
                {isCurrentTurn && (
                  <div className="flex items-center gap-1 text-xs text-green-300 font-bold mt-1">
                    <Clock size={12} />
                    <span>{Math.floor(timeSinceTurnStart / 1000)}с</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t tablet-l:border-t-0 pt-4 tablet-l:pt-0 border-green-700/50 w-full tablet-l:mt-auto">
        {showBell && (
          <button 
            onClick={() => ringBell(gameState.players[gameState.currentTurnIndex].id)}
            className="flex items-center justify-center gap-2 bg-yellow-400 text-green-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition font-bold text-sm shadow-md"
          >
            <Bell size={16} className="animate-bounce" /> Дзвіночок
          </button>
        )}

        {canGiveUp && (
          <button 
            onClick={giveUp}
            className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-bold text-sm shadow-md"
          >
            <Flag size={16} /> Здаюсь
          </button>
        )}
      </div>
    </div>
  );
};
