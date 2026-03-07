import React, { useState } from 'react';
import { useStore } from '../store';
import { Play, Users, Copy, Check, Bot } from 'lucide-react';

export const Lobby = () => {
  const { gameState, playerId, startGame, addBot, removeBot } = useStore();
  const [copied, setCopied] = useState(false);

  if (!gameState || gameState.status !== 'lobby') return null;

  const isInitiator = gameState.initiator === playerId;
  const canStart = isInitiator && gameState.players.length >= 2;
  const hasBot = gameState.players.some(p => p.isBot);
  const canAddBot = isInitiator && gameState.players.length < 6 && !hasBot;

  const handleCopy = () => {
    navigator.clipboard.writeText(gameState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    white: 'bg-white border border-gray-300',
    orange: 'bg-orange-500'
  };

  return (
    <div className="max-w-2xl mx-auto my-auto p-2 tablet-p:p-4 bg-[#F1F8E9] rounded-2xl shadow-xl border-4 border-[#7DA33C]/20 flex flex-col max-h-full tablet-p:max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-1 tablet-p:mb-2">
        <h2 className="text-lg tablet-p:text-xl font-black text-green-800 mb-0">Кімната очікування</h2>
        <p className="text-green-600 text-[8px] tablet-p:text-[10px] font-bold">Запросіть друзів за кодом гри</p>
      </div>

      <div className="flex justify-center mb-2 tablet-p:mb-3">
        <div className="flex items-center gap-1.5 tablet-p:gap-2 bg-white/50 p-1 tablet-p:p-2 rounded-xl border-2 border-dashed border-green-300">
          <span className="text-lg tablet-p:text-xl font-mono font-bold tracking-widest text-green-700">
            {gameState.roomId}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-green-600"
            title="Копіювати код"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <div className="mb-2 tablet-p:mb-3 flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col tablet-p:flex-row items-center justify-between mb-1.5 gap-1">
          <h3 className="text-sm tablet-p:text-base font-bold flex items-center gap-1.5 text-green-800">
            <Users size={16} className="text-green-600" />
            Гравці ({gameState.players.length}/6)
          </h3>
          <div className="flex gap-2">
            {canAddBot && (
              <button
                onClick={addBot}
                className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-bold text-[10px] transition-colors"
              >
                + Бот
              </button>
            )}
            {isInitiator && hasBot && (
              <button
                onClick={removeBot}
                className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-[10px] transition-colors"
              >
                - Бот
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5 tablet-p:gap-2">
          {gameState.players.map((player, index) => (
            <div 
              key={player.id}
              className="flex items-center gap-1.5 tablet-p:gap-2 p-1.5 tablet-p:p-2 bg-white/50 rounded-xl border border-green-100 relative"
            >
              <div className={`w-6 h-6 tablet-p:w-8 tablet-p:h-8 rounded-full shadow-inner flex-shrink-0 flex items-center justify-center text-[10px] tablet-p:text-xs font-bold ${tokenColors[player.tokenColor]} ${player.tokenColor === 'white' || player.tokenColor === 'yellow' ? 'text-gray-800' : 'text-white'}`}>
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[10px] tablet-p:text-xs flex items-center gap-1 truncate text-green-900">
                  {player.name}
                  {player.isBot && <Bot size={10} className="text-green-400" />}
                </div>
                <div className="text-[8px] tablet-p:text-[10px] text-green-600 font-medium">Вік: {player.age}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isInitiator ? (
        <button
          onClick={startGame}
          disabled={!canStart}
          className={`w-full py-2.5 tablet-p:py-3 rounded-xl font-bold text-base tablet-p:text-lg flex items-center justify-center gap-2 transition-all ${
            canStart 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play size={20} />
          Почати гру
        </button>
      ) : (
        <div className="text-center p-2 bg-green-50 text-green-700 rounded-xl font-medium text-xs">
          Очікуємо хоста...
        </div>
      )}
    </div>
  );
};
