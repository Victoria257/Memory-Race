import React, { useState } from 'react';
import { useStore } from '../store';
import { Play, Users, Copy, Check, Bot } from 'lucide-react';

export const Lobby = () => {
  const { gameState, playerId, startGame, addBot } = useStore();
  const [copied, setCopied] = useState(false);

  if (!gameState || gameState.status !== 'lobby') return null;

  const isInitiator = gameState.initiator === playerId;
  const canStart = isInitiator && gameState.players.length >= 2;
  const canAddBot = isInitiator && gameState.players.length < 6;

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
    <div className="max-w-2xl mx-auto mt-6 sm:mt-10 p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">Кімната очікування</h2>
        <p className="text-gray-500 text-sm sm:text-base">Запросіть друзів за кодом гри</p>
      </div>

      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-xl border-2 border-dashed border-gray-300">
          <span className="text-2xl sm:text-4xl font-mono font-bold tracking-widest text-blue-600">
            {gameState.roomId}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 sm:p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-blue-600"
            title="Копіювати код"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Гравці ({gameState.players.length}/6)
          </h3>
          {canAddBot && (
            <button
              onClick={addBot}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-bold transition-colors"
            >
              <Bot size={20} />
              Додати бота
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {gameState.players.map((player, index) => (
            <div 
              key={player.id}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 relative"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-inner flex items-center justify-center text-lg sm:text-xl font-bold ${tokenColors[player.tokenColor]} ${player.tokenColor === 'white' || player.tokenColor === 'yellow' ? 'text-gray-800' : 'text-white'}`}>
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg flex items-center gap-2">
                  {player.name}
                  {player.isBot && <Bot size={14} className="text-gray-400" />}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Вік: {player.age}</div>
              </div>
              {player.id === gameState.initiator && (
                <div className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded absolute top-2 right-2">
                  Хост
                </div>
              )}
            </div>
          ))}
          
          {Array.from({ length: 6 - gameState.players.length }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Users size={20} className="text-gray-400" />
              </div>
              <div className="text-gray-400 italic">Очікування...</div>
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
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg transform hover:-translate-y-1' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play size={24} />
          Почати гру
        </button>
      ) : (
        <div className="text-center p-4 bg-blue-50 text-blue-700 rounded-xl font-medium">
          Очікуємо, поки хост почне гру...
        </div>
      )}
    </div>
  );
};
