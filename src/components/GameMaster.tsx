import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { generateGameCommentary, speakText } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const GameMaster = () => {
  const { gameState, language, isMuted, playerId } = useStore();
  const [commentary, setCommentary] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const lastPhase = useRef<string | null>(null);
  const lastTurnIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState || !playerId) return;

    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    const isMyTurn = currentPlayer?.id === playerId;
    const isGeneralEvent = gameState.status === 'finished';
    
    let context = "";

    if (gameState.status === 'playing') {
      if (gameState.phase !== lastPhase.current) {
        if (gameState.phase === 'reveal' && gameState.currentSelection) {
          context = `${currentPlayer.name} guesses ${gameState.currentSelection.category} and ${gameState.currentSelection.color}. Let's see!`;
        } else if (gameState.phase === 'action' && gameState.currentCard) {
          context = `The card is ${gameState.currentCard.itemEn}! ${currentPlayer.name} was right?`;
        }
        lastPhase.current = gameState.phase;
      }

      if (gameState.currentTurnIndex !== lastTurnIndex.current) {
        context = `It's ${currentPlayer.name}'s turn now! Go go go!`;
        lastTurnIndex.current = gameState.currentTurnIndex;
      }
    } else if (gameState.status === 'finished') {
      context = "The race is over! What a performance!";
    }

    // Only proceed if we have context AND it's either my turn or a general event
    if (context && (isMyTurn || isGeneralEvent)) {
      const fetchCommentary = async () => {
        const text = await generateGameCommentary(context, language);
        if (text) {
          setCommentary(text);
          setIsVisible(true);
          if (!isMuted) {
            speakText(text);
          }
          setTimeout(() => setIsVisible(false), 5000);
        }
      };
      fetchCommentary();
    }
  }, [gameState, language, isMuted, playerId]);

  return (
    <AnimatePresence>
      {isVisible && commentary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-8 right-8 z-50 max-w-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-4 border-4 border-indigo-50 relative overflow-hidden">
            <div className="absolute -top-2 -left-2 bg-indigo-500 text-white p-1 rounded-full">
              <Sparkles size={16} />
            </div>
            <div className="text-indigo-900 font-black text-sm italic leading-tight">
              "{commentary}"
            </div>
            <div className="mt-2 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-right">
              Gemini Game Master
            </div>
          </div>
          <div className="w-4 h-4 bg-white border-r-4 border-b-4 border-indigo-500 transform rotate-45 absolute -bottom-2 right-8 shadow-lg"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
