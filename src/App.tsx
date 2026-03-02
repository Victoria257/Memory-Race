import React, { useEffect } from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { JoinGame } from './components/JoinGame';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { SelectionPanel } from './components/SelectionPanel';
import { Deck } from './components/Deck';
import { ActionPanel } from './components/ActionPanel';
import { PlayerList } from './components/PlayerList';

export default function App() {
  const { initSocket, gameState, playerId, reportActivity } = useStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    
    const isMyTurn = gameState.players[gameState.currentTurnIndex]?.id === playerId;
    if (!isMyTurn) return;

    let lastReport = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReport > 2000) {
        reportActivity();
        lastReport = now;
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [gameState, playerId, reportActivity]);

  // Auto-scroll to selection panel when it's user's turn and select phase
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    const isMyTurn = gameState.players[gameState.currentTurnIndex]?.id === playerId;
    if (isMyTurn && gameState.phase === 'select') {
      setTimeout(() => {
        const panel = document.getElementById('selection-panel');
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [gameState?.currentTurnIndex, gameState?.phase, playerId]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 flex flex-col gap-4">
        {!gameState ? (
          <JoinGame />
        ) : gameState.status === 'lobby' ? (
          <Lobby />
        ) : gameState.status === 'paused' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center border-2 border-yellow-400">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Гру призупинено</h2>
              <p className="text-gray-500">Очікуємо, поки хост відновить гру...</p>
            </div>
          </div>
        ) : gameState.status === 'finished' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center border-2 border-green-400 max-w-md w-full">
              <h2 className="text-4xl font-black text-gray-800 mb-6">Гру завершено!</h2>
              <div className="space-y-4">
                {gameState.players
                  .filter(p => p.place !== null)
                  .sort((a, b) => (a.place || 99) - (b.place || 99))
                  .map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-800 text-xl border-2 border-yellow-400' : 'bg-gray-100'}`}>
                      <span>{i + 1} місце</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1"
              >
                Нова гра
              </button>
            </div>
          </div>
        ) : (
          <>
            <Board />
            <PlayerList />
            
            <div className="flex flex-col lg:flex-row gap-4 mt-4 items-stretch">
              <div className="flex-1">
                <SelectionPanel />
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-row gap-4 flex-1 items-stretch">
                <div className="flex-shrink-0">
                  <Deck />
                </div>
                <div className="flex-1">
                  <ActionPanel />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
