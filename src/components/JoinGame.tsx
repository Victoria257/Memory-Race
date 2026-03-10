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
    <div className="max-w-md desktop:max-w-lg mx-auto my-auto p-4 tablet:p-6 tablet-landscape:p-3 bg-[#F1F8E9] rounded-[2.5rem] shadow-2xl border-8 border-[#7DA33C]/20 flex flex-col max-h-full tablet:max-h-[85vh] tablet-landscape:max-h-[98vh] overflow-y-auto">
      <div className="text-center mb-4 tablet:mb-6 tablet-landscape:mb-1">
        <h2 className="text-3xl tablet:text-4xl tablet-landscape:text-xl font-black text-green-800 mb-0 tracking-tight">Memory Race</h2>
        <p className="text-green-600 font-bold text-base tablet:text-lg tablet-landscape:text-xs">Веселі перегони пам'яті! 🏎️</p>
      </div>

      <div className="flex gap-2 mb-4 tablet-landscape:mb-1 bg-green-100/50 p-2 rounded-2xl">
        <button
          onClick={() => { setMode('create'); clearError(); }}
          className={`flex-1 py-3 tablet-landscape:py-2 rounded-xl font-black text-sm transition-all ${
            mode === 'create' ? 'bg-[#7DA33C] text-white shadow-md scale-105' : 'text-green-600 hover:text-green-800'
          }`}
        >
          Створити гру
        </button>
        <button
          onClick={() => { setMode('join'); clearError(); }}
          className={`flex-1 py-3 tablet-landscape:py-2 rounded-xl font-black text-sm transition-all ${
            mode === 'join' ? 'bg-[#7DA33C] text-white shadow-md scale-105' : 'text-green-600 hover:text-green-800'
          }`}
        >
          Приєднатися
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 tablet-landscape:space-y-1">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-black border-4 border-red-100 animate-bounce">
            {error}
          </div>
        )}

        {mode === 'join' && (
          <div>
            <label className="block text-[10px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Код гри 🔑</label>
            <input
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 tablet:py-3 tablet-landscape:py-1.5 rounded-2xl border-4 border-green-100 focus:border-green-400 focus:ring-8 focus:ring-green-100 transition-all outline-none font-mono text-xl tablet-landscape:text-lg text-center uppercase text-green-800 bg-white"
              placeholder="Введіть код"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Твоє ім'я ☀️</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 tablet:py-3 tablet-landscape:py-1.5 rounded-2xl border-4 border-green-100 focus:border-green-400 focus:ring-8 focus:ring-green-100 transition-all outline-none text-base tablet-landscape:text-sm font-bold bg-white text-gray-800"
            placeholder="Як тебе звати?"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Скільки тобі років? 🎂</label>
          <input
            type="number"
            required
            min="1"
            max="120"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value, 10))}
            className="w-full px-4 py-2 tablet:py-3 tablet-landscape:py-1.5 rounded-2xl border-4 border-green-100 focus:border-green-400 focus:ring-8 focus:ring-green-100 transition-all outline-none text-base tablet-landscape:text-sm font-bold bg-white text-gray-800"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-green-600 mb-0.5 uppercase tracking-widest">Вибери колір 🎨</label>
          <div className="flex flex-nowrap gap-2 justify-between overflow-x-auto pb-1">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-10 h-10 tablet:w-11 tablet:h-11 tablet-landscape:w-7 tablet-landscape:h-7 rounded-full border-4 transition-all transform flex-shrink-0 ${
                  color === c.id ? 'border-green-600 scale-110 rotate-12 shadow-xl' : 'border-white hover:scale-105 shadow-sm'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 tablet:py-4 tablet-landscape:py-2.5 rounded-2xl font-black text-lg tablet-landscape:text-base flex items-center justify-center gap-3 bg-gradient-to-r from-[#7DA33C] to-[#86B03C] hover:from-[#86B03C] hover:to-[#97C14D] text-white shadow-xl shadow-green-900/10 transform hover:-translate-y-1 active:scale-95 transition-all"
        >
          {mode === 'create' ? <UserPlus size={28} strokeWidth={3} /> : <LogIn size={28} strokeWidth={3} />}
          {mode === 'create' ? 'Поїхали!' : 'Зайти в гру'}
        </button>
      </form>
    </div>
  );
};
