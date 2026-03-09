import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Check } from 'lucide-react';

export const SelectionPanel = () => {
  const { gameState, playerId, selectAttributes, language } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(40);

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === playerId;
  const isSelectPhase = gameState.phase === 'select';
  const canSelect = isMyTurn && isSelectPhase;

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - gameState.turnStartTime) / 1000);
      const remaining = Math.max(0, 40 - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState?.turnStartTime, gameState?.status]);

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
    <div id="selection-panel" className="flex-grow h-full min-h-screen tablet:min-h-0 bg-[#F1F8E9] rounded-none tablet:rounded-3xl shadow-xl p-6 tablet-landscape:p-4 border-0 tablet:border-4 border-[#7DA33C]/20 transition-all duration-300 flex flex-col justify-center relative">
      {isSelectPhase && isMyTurn && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border-2 border-green-200 shadow-sm z-20">
          <div className={`w-3 h-3 rounded-full ${timeLeft < 10 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
          <span className={`font-black text-sm ${timeLeft < 10 ? 'text-red-600' : 'text-green-700'}`}>
            {timeLeft}с
          </span>
        </div>
      )}
      <h3 className="text-xl tablet-landscape:text-lg font-black mb-6 tablet-landscape:mb-3 text-green-800 flex items-center gap-2">
        {getStatusMessage()}
      </h3>

      <div className="mb-8 tablet-landscape:mb-3">
        <h4 className="text-xs font-black text-green-600 mb-3 tablet-landscape:mb-1 uppercase tracking-[0.2em]">🌈 Категорії</h4>
        <div className="grid grid-cols-3 tablet:grid-cols-4 gap-3 tablet-landscape:gap-2">
          {categories.map(c => (
            <button
              key={c.id}
              disabled={!canSelect}
              onClick={() => setSelectedCategory(c.id)}
              className={`p-2 tablet:p-3 tablet-landscape:p-1.5 rounded-2xl border-4 flex flex-col items-center justify-center transition-all transform
                ${selectedCategory === c.id ? 'border-green-600 bg-green-50 shadow-lg scale-110' : 'border-white/50 hover:border-green-100 hover:bg-white/30'}
                ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span className="text-2xl tablet:text-3xl tablet-landscape:text-xl mb-2 tablet-landscape:mb-1">{c.icon}</span>
              <span className="text-[10px] tablet:text-xs font-black text-center leading-tight text-gray-700">{c.name[language]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 tablet-landscape:mb-3">
        <h4 className="text-xs font-black text-green-600 mb-3 tablet-landscape:mb-1 uppercase tracking-[0.2em]">🎨 Кольори</h4>
        <div className="grid grid-cols-4 tablet:flex tablet:flex-row tablet:flex-nowrap gap-3 tablet:gap-3 tablet-landscape:gap-2 justify-items-center tablet:justify-between items-center py-6 tablet-landscape:py-3 px-4 bg-white/30 rounded-2xl overflow-x-auto scrollbar-hide">
          {colors.map(c => (
            <button
              key={c.id}
              disabled={!canSelect}
              onClick={() => setSelectedColor(c.id)}
              className={`w-10 h-10 tablet:w-14 tablet:h-14 tablet-landscape:w-10 tablet-landscape:h-10 rounded-full shadow-md transition-all flex items-center justify-center transform flex-shrink-0
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
        className={`w-full py-4 tablet:py-5 tablet-landscape:py-3 rounded-2xl font-black text-xl tablet-landscape:text-lg transition-all flex items-center justify-center gap-3 transform
          ${canSelect && selectedCategory && selectedColor 
            ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        <Check size={28} strokeWidth={4} /> ГОТОВО!
      </button>
    </div>
  );
};
