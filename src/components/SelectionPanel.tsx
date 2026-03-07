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

  const getStatusMessage = () => {
    if (!isMyTurn) return '⏳ Чекаємо на друзів...';
    if (isSelectPhase) return '🎯 Твій хід! Обирай:';
    if (gameState.phase === 'reveal') return '🎴 Категорію обрано! Відкривай карту';
    if (gameState.phase === 'action') return '🚀 Час робити хід!';
    return '🎯 Твій хід!';
  };

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
      
      // Scroll to deck after selection
      setTimeout(() => {
        const deckElement = document.getElementById('deck-panel');
        if (deckElement) {
          deckElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  return (
    <div id="selection-panel" className="flex-grow h-full bg-[#F1F8E9] rounded-none tablet-p:rounded-3xl shadow-xl p-4 tablet-p:p-5 border-0 tablet-p:border-4 border-[#7DA33C]/20 transition-all duration-300 flex flex-col justify-center overflow-y-auto">
      <h3 className="text-lg tablet-p:text-xl font-black mb-3 tablet-p:mb-4 text-green-800 flex items-center gap-2">
        {getStatusMessage()}
      </h3>

      <div className="mb-4 tablet-p:mb-5">
        <h4 className="text-[10px] tablet-p:text-xs font-black text-green-600 mb-1.5 tablet-p:mb-2 uppercase tracking-[0.2em]">🌈 Категорії</h4>
        <div className="grid grid-cols-3 tablet-p:grid-cols-4 gap-2 tablet-p:gap-3">
          {categories.map(c => (
            <button
              key={c.id}
              disabled={!canSelect}
              onClick={() => setSelectedCategory(c.id)}
              className={`p-1.5 tablet-p:p-2.5 rounded-xl tablet-p:rounded-2xl border-2 tablet-p:border-4 flex flex-col items-center justify-center transition-all transform
                ${selectedCategory === c.id ? 'border-green-600 bg-green-50 shadow-lg scale-105' : 'border-white/50 hover:border-green-100 hover:bg-white/30'}
                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span className="text-xl tablet-p:text-2xl mb-1 tablet-p:mb-1.5">{c.icon}</span>
              <span className="text-[9px] tablet-p:text-[11px] font-black text-center leading-tight text-gray-700">{c.name[language]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 tablet-p:mb-5">
        <h4 className="text-[10px] tablet-p:text-xs font-black text-green-600 mb-1.5 tablet-p:mb-2 uppercase tracking-[0.2em]">🎨 Кольори</h4>
        <div className="grid grid-cols-4 tablet-p:flex tablet-p:flex-row tablet-p:flex-nowrap gap-2 tablet-p:gap-3 justify-items-center tablet-p:justify-between items-center py-3 tablet-p:py-4 px-3 tablet-p:px-4 bg-white/30 rounded-2xl overflow-x-auto scrollbar-hide">
          {colors.map(c => (
            <button
              key={c.id}
              disabled={!canSelect}
              onClick={() => setSelectedColor(c.id)}
              className={`w-8 h-8 tablet-p:w-12 tablet-p:h-12 rounded-full shadow-md transition-all flex items-center justify-center transform flex-shrink-0
                ${c.bg} 
                ${selectedColor === c.id ? `ring-2 tablet-p:ring-4 ring-offset-2 tablet-p:ring-offset-2 ${c.ring} scale-110 shadow-xl` : 'hover:scale-110'}
                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}`}
              title={c.name[language]}
            >
              {selectedColor === c.id && <Check size={16} tablet-p:size={20} strokeWidth={4} className={c.id === 'white' || c.id === 'yellow' ? 'text-gray-800' : 'text-white'} />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleRemember}
        disabled={!canSelect || !selectedCategory || !selectedColor}
        className={`w-full py-3 tablet-p:py-4 rounded-xl tablet-p:rounded-2xl font-black text-lg tablet-p:text-xl transition-all flex items-center justify-center gap-2 tablet-p:gap-3 transform
          ${canSelect && selectedCategory && selectedColor 
            ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        <Check size={24} tablet-p:size={28} strokeWidth={4} /> ГОТОВО!
      </button>
    </div>
  );
};
