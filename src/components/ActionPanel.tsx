import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, FastForward, SkipForward } from 'lucide-react';

export const ActionPanel = () => {
  const { gameState, playerId, performAction } = useStore();
  const [showPenalty, setShowPenalty] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isActuallyVisible, setIsActuallyVisible] = useState(false);

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === playerId;
  const isActionPhase = gameState.phase === 'action';
  const canAct = isMyTurn && isActionPhase;

  const prevIsMyTurn = React.useRef(isMyTurn);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMyTurn) setShowPenalty(false);
    
    if (isActionPhase && isMyTurn) {
      setIsLocked(true);
      setIsActuallyVisible(false);
      const timer = setTimeout(() => {
        setIsLocked(false);
        setIsActuallyVisible(true);
      }, 2000); // Reduced from 4000 to 2000
      return () => clearTimeout(timer);
    } else {
      setIsLocked(false);
      setIsActuallyVisible(false);
    }
  }, [isActionPhase, isMyTurn]);

  useEffect(() => {
    if (!isMyTurn) setShowPenalty(false);
    
    if (!prevIsMyTurn.current && isMyTurn) {
      // Turn started, scroll to the selection panel (where categories are)
      setTimeout(() => {
        document.getElementById('selection-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    
    if (prevIsMyTurn.current && !isMyTurn) {
      // Turn ended, scroll to top to see the board and next player
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn]);

  useEffect(() => {
    if (isActuallyVisible && isActionPhase && isMyTurn) {
      // Buttons appeared, scroll to action panel
      setTimeout(() => {
        document.getElementById('action-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isActuallyVisible, isActionPhase, isMyTurn]);

  const handleAction = (action: 'pass' | 'move1' | 'move2') => {
    if (!canAct) return;

    // We can't do client-side prediction without expectedMoves, so we just send the action
    // and let the server handle the penalty logic.
    // Play synthetic move sound
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error('Audio error', e);
    }
    performAction(action);
  };

  return (
    <div 
      id="action-panel"
      className={`w-full h-full bg-[#F1F8E9] text-gray-800 p-6 transition-all duration-500 rounded-none sm:rounded-3xl shadow-xl border-0 sm:border-4 border-[#7DA33C]/20 ${isActionPhase ? 'opacity-100' : 'opacity-50 grayscale pointer-events-none'} flex flex-col justify-center`}>
      
      <div className="max-w-4xl mx-auto relative h-full flex flex-col justify-center w-full">
        {!isActuallyVisible && isActionPhase && isMyTurn ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-xl font-black text-green-600 animate-pulse uppercase tracking-widest">Слухай уважно...</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-black mb-6 text-center text-green-800 uppercase tracking-[0.2em]">
              {canAct ? '🚀 Твій хід! Куди їдемо?' : '😴 Чекаємо на хід...'}
            </h3>

            <div className="flex flex-col justify-center gap-3 sm:gap-4">
              <button
                disabled={!canAct || showPenalty || isLocked}
                onClick={() => handleAction('pass')}
                className={`px-4 sm:px-6 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform
                  ${canAct && !showPenalty && !isLocked ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-md' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
                  border-4 border-gray-200 w-full`}
              >
                <SkipForward size={24} strokeWidth={3} /> <span className="whitespace-nowrap">Пропустити</span>
              </button>

              <button
                disabled={!canAct || showPenalty || isLocked}
                onClick={() => handleAction('move1')}
                className={`px-4 sm:px-6 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform
                  ${canAct && !showPenalty && !isLocked ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:scale-110 active:scale-95 shadow-xl shadow-blue-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
                  border-4 border-blue-300 w-full`}
              >
                <ArrowRight size={24} strokeWidth={3} /> <span className="whitespace-nowrap">1 крок</span>
              </button>

              <button
                disabled={!canAct || showPenalty || isLocked}
                onClick={() => handleAction('move2')}
                className={`px-4 sm:px-6 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform
                  ${canAct && !showPenalty && !isLocked ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white hover:scale-110 active:scale-95 shadow-xl shadow-emerald-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
                  border-4 border-emerald-300 w-full`}
              >
                <FastForward size={24} strokeWidth={3} /> <span className="whitespace-nowrap">2 кроки!</span>
              </button>
            </div>
          </>
        )}

        <AnimatePresence>
          {showPenalty && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center bg-red-600/90 rounded-xl backdrop-blur-sm z-10 p-4"
            >
              <div className="text-xl sm:text-3xl font-black text-white uppercase tracking-widest drop-shadow-lg flex items-center gap-2 sm:gap-4 text-center">
                <span className="text-3xl sm:text-5xl">⚠️</span>
                Не вгадав! Пропускаєш хід
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
