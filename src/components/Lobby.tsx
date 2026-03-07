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
    <div className="max-w-2xl mx-auto my-auto p-4 tablet-p:p-6 bg-[#F1F8E9] rounded-2xl shadow-xl border-4 border-[#7DA33C]/20 flex flex-col max-h-full tablet-p:max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-4 tablet-p:mb-6">
        <h2 className="text-xl tablet-p:text-2xl font-black text-green-800 mb-1">Кімната очікування</h2>
        <p className="text-green-600 text-xs tablet-p:text-sm font-bold">Запросіть друзів за кодом гри</p>
      </div>

      <div className="flex justify-center mb-4 tablet-p:mb-6">
        <div className="flex items-center gap-2 tablet-p:gap-3 bg-white/50 p-2 tablet-p:p-3 rounded-xl border-2 border-dashed border-green-300">
          <span className="text-xl tablet-p:text-3xl font-mono font-bold tracking-widest text-green-700">
            {gameState.roomId}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 tablet-p:p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-green-600"
            title="Копіювати код"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="mb-4 tablet-p:mb-6 flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col tablet-p:flex-row items-center justify-between mb-3 gap-2">
          <h3 className="text-base tablet-p:text-lg font-bold flex items-center gap-2 text-green-800">
            <Users size={18} className="text-green-600" />
            Гравці ({gameState.players.length}/6)
          </h3>
          {canAddBot && (
            <button
              onClick={addBot}
              className="w-full tablet-p:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-bold text-sm transition-colors"
            >
              <Bot size={18} />
              Додати бота
            </button>
          )}
          {isInitiator && hasBot && (
            <button
              onClick={removeBot}
              className="w-full tablet-p:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-sm transition-colors"
            >
              <Bot size={18} />
              Видалити бота
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 tablet-p:gap-3">
          {gameState.players.map((player, index) => (
            <div 
              key={player.id}
              className="flex items-center gap-2 tablet-p:gap-3 p-2 tablet-p:p-3 bg-white/50 rounded-xl border border-green-100 relative"
            >
              <div className={`w-8 h-8 tablet-p:w-10 tablet-p:h-10 rounded-full shadow-inner flex-shrink-0 flex items-center justify-center text-sm tablet-p:text-base font-bold ${tokenColors[player.tokenColor]} ${player.tokenColor === 'white' || player.tokenColor === 'yellow' ? 'text-gray-800' : 'text-white'}`}>
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs tablet-p:text-sm flex items-center gap-1 truncate text-green-900">
                  {player.name}
                  {player.isBot && <Bot size={12} className="text-green-400" />}
                </div>
                <div className="text-[10px] tablet-p:text-xs text-green-600 font-medium">Вік: {player.age}</div>
              </div>
              {player.id === gameState.initiator && (
                <div className="absolute top-1 right-1 text-[8px] font-bold bg-green-100 text-green-700 px-1 rounded">
                  Хост
                </div>
              )}
            </div>
          ))}
          
          {Array.from({ length: 6 - gameState.players.length }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              className="flex items-center gap-2 p-2 bg-white/20 rounded-xl border border-dashed border-green-300 opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-green-200" />
              </div>
              <div className="text-[10px] text-green-300 italic truncate">Очікування...</div>
            </div>
          ))}
        </div>
      </div>

      {isInitiator ? (
        <button
          onClick={startGame}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all ${
            canStart 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:-translate-y-1' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play size={24} />
          Почати гру
        </button>
      ) : (
        <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl font-medium">
          Очікуємо, поки хост почне гру...
        </div>
      )}
    </div>
  );
};
