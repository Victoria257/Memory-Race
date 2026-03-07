import React, { useState } from 'react';
import { useStore } from '../store';
import { LogIn, UserPlus } from 'lucide-react';

export const JoinGame = () => {
  const { createGame, joinGame, setPlayerInfo, playerName, playerAge, playerTokenColor, error, clearError } = useStore();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState(playerName);
  const [age, setAge] = useState(playerAge);
  const [color, setColor] = useState(playerTokenColor);

  const colors = [
    { id: 'blue', label: 'Синій', hex: '#60a5fa' },
    { id: 'yellow', label: 'Жовтий', hex: '#fde047' },
    { id: 'green', label: 'Зелений', hex: '#4ade80' },
    { id: 'purple', label: 'Фіолетовий', hex: '#c084fc' },
    { id: 'pink', label: 'Рожевий', hex: '#f472b6' },
    { id: 'orange', label: 'Помаранчевий', hex: '#fb923c' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerInfo(name, age, color);
    if (mode === 'create') {
      createGame();
    } else {
      joinGame(roomId);
    }
  };

  return (
    <div className="max-w-md mx-auto my-auto p-2 tablet-p:p-4 bg-[#F1F8E9] rounded-[2rem] shadow-2xl border-4 tablet-p:border-8 border-[#7DA33C]/20 flex flex-col max-h-full tablet-p:max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-1 tablet-p:mb-3">
        <h2 className="text-2xl tablet-p:text-3xl font-black text-green-800 mb-0 tracking-tight">Memory Race</h2>
        <p className="text-green-600 font-bold text-xs tablet-p:text-sm">Веселі перегони пам'яті! 🏎️</p>
      </div>

      <div className="flex gap-1 mb-2 bg-green-100/50 p-1 rounded-xl">
        <button
          onClick={() => { setMode('create'); clearError(); }}
          className={`flex-1 py-1.5 tablet-p:py-2 rounded-lg font-black text-[10px] tablet-p:text-xs transition-all ${
            mode === 'create' ? 'bg-[#7DA33C] text-white shadow-md scale-105' : 'text-green-600 hover:text-green-800'
          }`}
        >
          Створити гру
        </button>
        <button
          onClick={() => { setMode('join'); clearError(); }}
          className={`flex-1 py-1.5 tablet-p:py-2 rounded-lg font-black text-[10px] tablet-p:text-xs transition-all ${
            mode === 'join' ? 'bg-[#7DA33C] text-white shadow-md scale-105' : 'text-green-600 hover:text-green-800'
          }`}
        >
          Приєднатися
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 tablet-p:space-y-3">
        {error && (
          <div className="p-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black border-2 border-red-100 animate-bounce">
            {error}
          </div>
        )}

        {mode === 'join' && (
          <div>
            <label className="block text-[8px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Код гри 🔑</label>
            <input
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 rounded-xl border-2 border-green-100 focus:border-green-400 transition-all outline-none font-mono text-lg text-center uppercase text-green-800 bg-white"
              placeholder="Введіть код"
            />
          </div>
        )}

        <div>
          <label className="block text-[8px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Твоє ім'я ☀️</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border-2 border-green-100 focus:border-green-400 transition-all outline-none text-xs tablet-p:text-sm font-bold bg-white text-gray-800"
            placeholder="Як тебе звати?"
          />
        </div>

        <div>
          <label className="block text-[8px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Вік 🎂</label>
          <input
            type="number"
            required
            min="1"
            max="120"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 rounded-xl border-2 border-green-100 focus:border-green-400 transition-all outline-none text-xs tablet-p:text-sm font-bold bg-white text-gray-800"
          />
        </div>

        <div>
          <label className="block text-[8px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Колір 🎨</label>
          <div className="flex flex-nowrap gap-1.5 justify-between overflow-x-auto pb-1">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-7 h-7 tablet-p:w-9 tablet-p:h-9 rounded-full border-2 transition-all transform flex-shrink-0 ${
                  color === c.id ? 'border-green-600 scale-110 shadow-lg' : 'border-white hover:scale-105 shadow-sm'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 tablet-p:py-3 rounded-xl font-black text-sm tablet-p:text-base flex items-center justify-center gap-2 bg-gradient-to-r from-[#7DA33C] to-[#86B03C] hover:from-[#86B03C] hover:to-[#97C14D] text-white shadow-lg transform hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          {mode === 'create' ? <UserPlus size={20} strokeWidth={3} /> : <LogIn size={20} strokeWidth={3} />}
          {mode === 'create' ? 'Поїхали!' : 'Зайти в гру'}
        </button>
      </form>
    </div>
  );
};
