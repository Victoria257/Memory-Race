import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { Download } from 'lucide-react';
import { JoinGame } from './components/JoinGame';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { SelectionPanel } from './components/SelectionPanel';
import { Deck } from './components/Deck';
import { ActionPanel } from './components/ActionPanel';
import { PlayerList } from './components/PlayerList';

export default function App() {
  const { initSocket, gameState, playerId, reportActivity } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

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
      }, 800); // Increased delay to ensure rendering is complete
    }
  }, [gameState?.currentTurnIndex, gameState?.phase, gameState?.status, playerId]);

  return (
    <div className="min-h-screen bg-[#86B03C] font-sans text-gray-900 flex flex-col">
      <Header />
      
      {showInstallBanner && (
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <img src="https://cdn-icons-png.flaticon.com/512/8418/8418425.png" alt="App Icon" className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold">Встановити Memory Race</p>
              <p className="text-xs text-blue-100">Додай гру на головний екран для швидкого доступу!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-blue-700 rounded-lg transition-colors"
            >
              Пізніше
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg shadow-md hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Встановити
            </button>
          </div>
        </div>
      )}
      
      <main className="flex-1 container mx-auto p-0 tablet-p:p-4 flex flex-col gap-0 tablet-p:gap-4">
        {!gameState ? (
          <div className="min-h-screen flex items-center justify-center p-4">
            <JoinGame />
          </div>
        ) : gameState.status === 'lobby' ? (
          <div className="min-h-screen p-4">
            <Lobby />
          </div>
        ) : gameState.status === 'paused' ? (
          <div className="flex-1 flex items-center justify-center min-h-screen p-4">
            <div className="bg-[#F1F8E9] p-8 rounded-2xl shadow-xl text-center border-4 border-[#7DA33C]">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Гру призупинено</h2>
              <p className="text-gray-500">Очікуємо, поки хост відновить гру...</p>
            </div>
          </div>
        ) : gameState.status === 'finished' ? (
          <div className="flex-1 flex items-center justify-center min-h-screen p-4">
            <div className="bg-[#F1F8E9] p-8 rounded-2xl shadow-xl text-center border-4 border-[#7DA33C] max-w-md w-full">
              <h2 className="text-4xl font-black text-gray-800 mb-6">Гру завершено!</h2>
              <div className="space-y-4">
                {gameState.players
                  .filter(p => p.place !== null)
                  .sort((a, b) => (a.place || 99) - (b.place || 99))
                  .map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-800 text-xl border-2 border-yellow-400' : 'bg-white/50'}`}>
                      <span>{i + 1} місце</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-8 w-full py-4 bg-[#7DA33C] hover:bg-[#86B03C] text-white rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1"
              >
                Нова гра
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0 tablet-p:gap-4">
            <div className="h-[calc(100vh-64px)] tablet-p:h-[calc(100vh-80px)] flex flex-col tablet-l:flex-row p-0 overflow-hidden">
              <div className="flex-1 h-full overflow-hidden">
                <Board />
              </div>
              <div className="h-auto tablet-l:h-full tablet-l:w-48 bg-[#86B03C]/20 flex-shrink-0">
                <PlayerList />
              </div>
            </div>
            
            <div className="flex flex-col tablet-l:flex-row gap-0 tablet-p:gap-4 items-stretch">
              <div className="flex-1 min-h-screen flex flex-col">
                <SelectionPanel />
              </div>
              <div className="flex flex-col tablet-p:flex-row gap-0 tablet-p:gap-4 flex-1 items-stretch">
                <div className="flex-shrink-0 min-h-screen flex flex-col">
                  <Deck />
                </div>
                <div className="flex-1 min-h-screen flex flex-col">
                  <ActionPanel />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
