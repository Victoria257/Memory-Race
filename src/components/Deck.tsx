import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { speakText } from '../services/geminiService';
import { Dog, Cat, Rabbit, Bird, Fish, Turtle } from 'lucide-react';

export const Deck = () => {
  const { gameState, playerId, revealCard, language, isMuted } = useStore();
  const lastSpokenCardId = useRef<string | null>(null);

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === playerId;
  const isRevealPhase = gameState.phase === 'reveal';
  const canReveal = isMyTurn && isRevealPhase;

  const handleReveal = () => {
    if (canReveal) {
      revealCard();
    }
  };

  useEffect(() => {
    if (gameState.currentCard && gameState.currentCard.id !== lastSpokenCardId.current) {
      if (isMyTurn && !isMuted) {
        // Play sound based on language and card content using Gemini TTS
        const textToSpeak = `${gameState.currentCard[`item${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof typeof gameState.currentCard]}. ${gameState.currentCard[`color${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof typeof gameState.currentCard]}`;
        speakText(textToSpeak, language);
        
        // Scroll to card on mobile
        setTimeout(() => {
          document.getElementById('deck-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
      lastSpokenCardId.current = gameState.currentCard.id;
    }
  }, [gameState.currentCard, language, isMuted, isMyTurn]);

  return (
    <div id="deck-panel" className="w-full sm:w-64 lg:w-72 h-full bg-[#F1F8E9] rounded-none sm:rounded-3xl shadow-xl p-6 flex flex-col items-center justify-center relative border-0 sm:border-4 border-[#7DA33C]/20 transition-all duration-300 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] overflow-hidden">
        <Dog className="absolute top-10 left-10 rotate-12" size={48} />
        <Cat className="absolute bottom-20 right-10 -rotate-12" size={56} />
        <Rabbit className="absolute top-1/2 left-5 -rotate-45" size={40} />
        <Bird className="absolute top-20 right-20 rotate-45" size={44} />
        <Fish className="absolute bottom-10 left-20 rotate-180" size={52} />
        <Turtle className="absolute bottom-1/3 right-5 rotate-12" size={48} />
      </div>

      <div className="text-xs font-black text-green-600 mb-6 uppercase tracking-[0.2em] relative z-10">📦 Колода ({gameState.deckCount})</div>
      
      <div className="relative w-[65vw] h-[95vw] max-w-[220px] max-h-[340px] sm:w-52 sm:h-80 perspective-1000">
        <AnimatePresence mode="wait">
          {!gameState.currentCard ? (
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.4, type: 'spring' }}
              onClick={handleReveal}
              className={`absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700 rounded-[2rem] border-8 border-white shadow-2xl flex items-center justify-center cursor-pointer overflow-hidden
                ${canReveal ? 'hover:scale-105 hover:shadow-green-200 ring-8 ring-yellow-600' : 'opacity-90'}`}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="w-28 h-44 sm:w-36 sm:h-56 border-4 border-white/30 rounded-3xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
                <span className="text-white font-black text-3xl sm:text-5xl transform -rotate-12 drop-shadow-lg">?</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="absolute inset-0 bg-white rounded-[2rem] border-8 border-white shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Top Right Color Circle */}
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-md z-10 border-2 border-gray-50">
                <div 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner border-2 border-white"
                  style={{ backgroundColor: gameState.currentCard.color === 'gray' ? '#94a3b8' : 
                                        gameState.currentCard.color === 'black' ? '#0f172a' : 
                                        gameState.currentCard.color === 'blue' ? '#60a5fa' : 
                                        gameState.currentCard.color === 'yellow' ? '#fde047' : 
                                        gameState.currentCard.color === 'green' ? '#4ade80' : 
                                        gameState.currentCard.color === 'red' ? '#f87171' : 
                                        gameState.currentCard.color === 'brown' ? '#b45309' : '#ffffff' }}
                />
              </div>

              {/* Center Item Image or Name (Large) */}
              <div className="flex-grow flex items-center justify-center p-2 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
                {gameState.currentCard.imageUrl ? (
                  <img 
                    src={gameState.currentCard.imageUrl} 
                    alt={gameState.currentCard.itemEn}
                    className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-black text-center text-green-800 leading-tight drop-shadow-sm px-4">
                    {gameState.currentCard[`item${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof typeof gameState.currentCard]}
                  </h2>
                )}
              </div>

              {/* Bottom Label */}
              <div className="bg-green-600 text-white text-center py-2 sm:py-3 text-sm sm:text-base font-black tracking-wide mx-3 mb-3 rounded-2xl shadow-sm">
                {gameState.currentCard[`item${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof typeof gameState.currentCard]}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {canReveal && (
        <div className="mt-6 text-green-700 font-black animate-bounce text-center text-sm sm:text-base bg-green-50 px-4 py-2 rounded-full shadow-sm border-2 border-green-100">
          👇 Тисни сюди!
        </div>
      )}
    </div>
  );
};
