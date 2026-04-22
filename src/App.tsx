import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { Header } from './components/Header';
import { Download, Video, VideoOff, Mic, MicOff, Bell, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JoinGame } from './components/JoinGame';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { SelectionPanel } from './components/SelectionPanel';
import { Deck } from './components/Deck';
import { ActionPanel } from './components/ActionPanel';
import { VideoAvatar } from './components/VideoAvatar';

export default function App() {
  const { initSocket, gameState, playerId, reportActivity, localStream, setLocalStream, setCameraError, ringBell, giveUp, cameraError } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  // Turn timer logic for UI buttons
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState?.status === 'playing') {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (gameState.turnStartTime || Date.now())) / 1000);
        setTimeLeft(Math.max(0, 40 - elapsed));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState?.turnStartTime, gameState?.status]);

  const isMyTurn = gameState?.players[gameState.currentTurnIndex]?.id === playerId;
  const showBell = !isMyTurn && timeLeft < 10 && gameState?.status === 'playing';
  const anyPlayerFinished = gameState?.players.some(p => p.place !== null);
  const myPlayer = gameState?.players.find(p => p.id === playerId);
  const canGiveUp = anyPlayerFinished && myPlayer && myPlayer.place === null && gameState?.status === 'playing';

  // Initialize camera globally
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (isCameraStarting || localStream) return;
      setIsCameraStarting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } 
        });
        
        // Ensure all tracks are enabled by default
        stream.getTracks().forEach(track => {
          track.enabled = true;
        });

        console.log(`[App] Camera & Mic started. Audio tracks: ${stream.getAudioTracks().length}`);
        setLocalStream(stream);
        setCameraError(null);
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Камера недоступна");
      } finally {
        setIsCameraStarting(false);
      }
    };

    startCamera();

    return () => {
      // Don't stop tracks here to allow persistence, but let's be clean if the whole app unmounts
    };
  }, [gameState?.status, localStream, isCameraStarting]);

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
    if (playerId) {
      console.log('[App] Player ID initialized:', playerId);
    } else {
      console.log('[App] Player ID is not yet set');
    }
    initSocket();
  }, [initSocket, playerId]);

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
      
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-0 tablet:px-4 desktop:pr-[180px] flex flex-col overflow-x-hidden snap-y snap-mandatory h-[calc(100vh-72px)] tablet:h-[calc(100vh-80px)] overflow-y-auto scroll-smooth">
        {/* Floating Cameras Container - Truly on top of everything */}
        <AnimatePresence>
          {gameState && gameState.status === 'playing' && (
            <motion.div
              drag
              dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: 0, bottom: window.innerHeight - 400 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-3 touch-none pointer-events-auto"
              style={{ position: 'fixed' }}
            >
              {/* Drag handle for the whole stack */}
              <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto mb-1 shadow-sm opacity-40 hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col gap-3">
                {gameState.players
                  .filter(p => !p.isBot) // Only human players have cameras
                  .map(player => (
                    <VideoAvatar 
                      key={`floating-${player.id}`} 
                      player={player} 
                      localStream={localStream} 
                    />
                  ))
                }

                {/* Floating Game Controls */}
                <div className="flex flex-col gap-2 mt-2">
                  <AnimatePresence>
                    {showBell && (
                      <motion.button 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => ringBell(gameState.players[gameState.currentTurnIndex].id)}
                        className="bg-yellow-400 text-green-900 p-3 rounded-full shadow-xl hover:bg-yellow-500 transition-all border-2 border-white flex items-center justify-center"
                        title="Подзвонити в дзвіночок"
                      >
                        <Bell size={24} className="animate-bounce" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {canGiveUp && (
                      <motion.button 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={giveUp}
                        className="bg-red-500 text-white p-3 rounded-full shadow-xl hover:bg-red-600 transition-all border-2 border-white flex items-center justify-center"
                        title="Здатися"
                      >
                        <Flag size={20} />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <button 
                      onClick={toggleMic}
                      className={`p-3 rounded-full shadow-xl transition-all border-2 border-white flex items-center justify-center ${isMicMuted ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-white'}`}
                      title={isMicMuted ? "Увімкнути мікрофон" : "Вимкнути мікрофон"}
                    >
                      {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button 
                      onClick={toggleCamera}
                      className={`p-3 rounded-full shadow-xl transition-all border-2 border-white flex items-center justify-center ${isCameraOff ? 'bg-red-500 text-white' : 'bg-gray-800/80 text-white'}`}
                      title={isCameraOff ? "Увімкнути камеру" : "Вимкнути камеру"}
                    >
                      {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!gameState ? (
          <div className="min-h-full flex items-center justify-center p-4 snap-start">
            <JoinGame />
          </div>
        ) : gameState.status === 'lobby' ? (
          <div className="min-h-full flex items-center justify-center p-4 snap-start">
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
                    <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl font-bold ${i === 0 && p.place !== 99 ? 'bg-yellow-100 text-yellow-800 text-xl border-2 border-yellow-400' : 'bg-white/50'}`}>
                      <span>{p.place === 99 ? 'Вибув' : `${i + 1} місце`}</span>
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
          <div className="flex flex-col">
            <div className="h-[calc(100vh-72px)] tablet:h-[calc(100vh-80px)] flex flex-col desktop:flex-row p-0 overflow-hidden snap-start">
              <div className="flex-1 h-full overflow-hidden">
                <Board />
              </div>
            </div>
            
            <div className="flex flex-col desktop:flex-row gap-0 tablet:gap-4 items-stretch min-h-[calc(100vh-80px)] py-4 tablet:py-8 snap-start">
              <div className="flex-1 min-h-screen desktop:min-h-0 flex flex-col">
                <SelectionPanel />
              </div>
              <div className="flex flex-col tablet:flex-row gap-0 tablet:gap-4 flex-1 items-stretch">
                <div className="flex-shrink-0 min-h-screen desktop:min-h-0 flex flex-col">
                  <Deck />
                </div>
                <div className="flex-1 min-h-screen desktop:min-h-0 flex flex-col">
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
