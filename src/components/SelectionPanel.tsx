import React, { useState } from 'react';
import { useStore } from '../store';
import { Check } from 'lucide-react';

export const SelectionPanel = () => {
  const { gameState, playerId, selectAttributes, language } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === playerId;
  const isSelectPhase = gameState.phase === 'select';
  const canSelect = isMyTurn && isSelectPhase;

  const categories = [
    { id: 'furniture', icon: '🛋️', name: { uk: 'Меблі', en: 'Furniture', sv: 'Möbler' } },
    { id: 'appliances', icon: '📺', name: { uk: 'Техніка', en: 'Appliances', sv: 'Apparater' } },
    { id: 'transport', icon: '🚗', name: { uk: 'Транспорт', en: 'Transport', sv: 'Transport' } },
    { id: 'animals', icon: '🐶', name: { uk: 'Тварини і птахи', en: 'Animals', sv: 'Djur' } },
    { id: 'food', icon: '🍎', name: { uk: 'Їжа і напої', en: 'Food', sv: 'Mat' } },
    { id: 'clothing', icon: '👕', name: { uk: 'Одяг і аксесуари', en: 'Clothing', sv: 'Kläder' } },
    { id: 'dishes', icon: '🍽️', name: { uk: 'Посуд', en: 'Dishes', sv: 'Porslin' } }
  ];

  const colors = [
    { id: 'gray', bg: 'bg-gray-500', ring: 'ring-gray-700', name: { uk: 'Сірий', en: 'Gray', sv: 'Grå' } },
    { id: 'black', bg: 'bg-black', ring: 'ring-gray-900', name: { uk: 'Чорний', en: 'Black', sv: 'Svart' } },
    { id: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-700', name: { uk: 'Синій', en: 'Blue', sv: 'Blå' } },
    { id: 'yellow', bg: 'bg-yellow-400', ring: 'ring-yellow-600', name: { uk: 'Жовтий', en: 'Yellow', sv: 'Gul' } },
    { id: 'green', bg: 'bg-green-500', ring: 'ring-green-700', name: { uk: 'Зелений', en: 'Green', sv: 'Grön' } },
    { id: 'red', bg: 'bg-red-500', ring: 'ring-red-700', name: { uk: 'Червоний', en: 'Red', sv: 'Röd' } },
    { id: 'brown', bg: 'bg-amber-800', ring: 'ring-amber-950', name: { uk: 'Коричневий', en: 'Brown', sv: 'Brun' } },
    { id: 'white', bg: 'bg-white border border-gray-300', ring: 'ring-gray-400', name: { uk: 'Білий', en: 'White', sv: 'Vit' } }
  ];

  const handleRemember = () => {
    if (canSelect && selectedCategory && selectedColor) {
      selectAttributes(selectedCategory, selectedColor);
      setSelectedCategory(null);
      setSelectedColor(null);
    }
  };

  return (
    <div className="flex-grow h-full bg-white rounded-3xl shadow-xl p-6 border-4 border-indigo-50 transition-all duration-300">
      <h3 className="text-xl font-black mb-6 text-indigo-600 flex items-center gap-2">
        {canSelect ? '🎯 Твій хід! Обирай:' : '⏳ Чекаємо на друзів...'}
      </h3>

      <div className="mb-8">
        <h4 className="text-xs font-black text-indigo-300 mb-3 uppercase tracking-[0.2em]">🌈 Категорії</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {categories.map(c => (
            <button
              key={c.id}
              disabled={!canSelect}
              onClick={() => setSelectedCategory(c.id)}
              className={`p-2 sm:p-3 rounded-2xl border-4 flex flex-col items-center justify-center transition-all transform
                ${selectedCategory === c.id ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-110' : 'border-gray-50 hover:border-indigo-100 hover:bg-gray-50'}
                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span className="text-2xl sm:text-3xl mb-2">{c.icon}</span>
              <span className="text-[10px] sm:text-xs font-black text-center leading-tight text-gray-700">{c.name[language]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-black text-indigo-300 mb-3 uppercase tracking-[0.2em]">🎨 Кольори</h4>
        <div className="flex flex-row flex-nowrap gap-2 sm:gap-3 justify-between items-center overflow-x-auto pb-4 pt-6 px-4 bg-gray-50/50 rounded-2xl scrollbar-hide">
          {colors.map(c => (
            <button
              key={c.id}
              disabled={!canSelect}
              onClick={() => setSelectedColor(c.id)}
              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full shadow-md transition-all flex-shrink-0 flex items-center justify-center transform
                ${c.bg} 
                ${selectedColor === c.id ? `ring-4 ring-offset-4 ${c.ring} scale-110 shadow-xl` : 'hover:scale-110'}
                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
              title={c.name[language]}
            >
              {selectedColor === c.id && <Check size={20} strokeWidth={4} className={c.id === 'white' || c.id === 'yellow' ? 'text-gray-800' : 'text-white'} />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleRemember}
        disabled={!canSelect || !selectedCategory || !selectedColor}
        className={`w-full py-4 sm:py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 transform
          ${canSelect && selectedCategory && selectedColor 
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95' 
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
      >
        <Check size={28} strokeWidth={4} /> ГОТОВО!
      </button>
    </div>
  );
};
