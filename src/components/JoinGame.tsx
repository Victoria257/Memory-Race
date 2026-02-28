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
    <div className="max-w-md mx-auto mt-10 sm:mt-20 p-4 sm:p-8 bg-white rounded-[2.5rem] shadow-2xl border-8 border-sky-50">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 tracking-tight">Memory Race</h2>
        <p className="text-sky-400 font-bold text-lg sm:text-xl">Веселі перегони пам'яті! 🏎️</p>
      </div>

      <div className="flex gap-2 mb-8 bg-sky-50 p-2 rounded-2xl">
        <button
          onClick={() => { setMode('create'); clearError(); }}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
            mode === 'create' ? 'bg-white text-blue-500 shadow-md scale-105' : 'text-sky-300 hover:text-sky-500'
          }`}
        >
          Створити гру
        </button>
        <button
          onClick={() => { setMode('join'); clearError(); }}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
            mode === 'join' ? 'bg-white text-blue-500 shadow-md scale-105' : 'text-sky-300 hover:text-sky-500'
          }`}
        >
          Приєднатися
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-black border-4 border-red-100 animate-bounce">
            {error}
          </div>
        )}

        {mode === 'join' && (
          <div>
            <label className="block text-sm font-black text-sky-600 mb-2 uppercase tracking-widest">Код гри 🔑</label>
            <input
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-6 py-4 rounded-2xl border-4 border-sky-100 focus:border-blue-400 focus:ring-8 focus:ring-blue-50 transition-all outline-none font-mono text-2xl text-center uppercase text-blue-600"
              placeholder="Введіть код"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-black text-sky-600 mb-2 uppercase tracking-widest">Твоє ім'я ☀️</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl border-4 border-sky-100 focus:border-blue-400 focus:ring-8 focus:ring-blue-50 transition-all outline-none text-lg font-bold"
            placeholder="Як тебе звати?"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-sky-600 mb-2 uppercase tracking-widest">Скільки тобі років? 🎂</label>
          <input
            type="number"
            required
            min="1"
            max="120"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value, 10))}
            className="w-full px-6 py-4 rounded-2xl border-4 border-sky-100 focus:border-blue-400 focus:ring-8 focus:ring-blue-50 transition-all outline-none text-lg font-bold"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-sky-600 mb-2 uppercase tracking-widest">Вибери колір 🎨</label>
          <div className="flex flex-wrap gap-3 justify-center">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 transition-all transform ${
                  color === c.id ? 'border-blue-400 scale-125 rotate-12 shadow-xl' : 'border-white hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex, boxShadow: color === c.id ? '0 0 0 4px white inset' : '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl shadow-blue-100 transform hover:-translate-y-2 active:scale-95 transition-all"
        >
          {mode === 'create' ? <UserPlus size={28} strokeWidth={3} /> : <LogIn size={28} strokeWidth={3} />}
          {mode === 'create' ? 'Поїхали!' : 'Зайти в гру'}
        </button>
      </form>
    </div>
  );
};
