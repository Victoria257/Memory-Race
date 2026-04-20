import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Bell, Clock, Flag, Video, VideoOff } from 'lucide-react';
import { VideoAvatar } from './VideoAvatar';

export const PlayerList = () => {
  const { gameState, playerId, ringBell, giveUp, localStream, cameraError, setLocalStream, setCameraError } = useStore();
  const [timeLeft, setTimeLeft] = useState(40);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  if (!gameState) return null;

  const refreshCamera = async () => {
    if (isCameraStarting) return;
    setIsCameraStarting(true);
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setLocalStream(stream);
      setCameraError(null);
      console.log("[WebRTC] Camera refreshed");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Камера недоступна");
    } finally {
      setIsCameraStarting(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.status === 'playing') {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
        setTimeLeft(Math.max(0, 40 - elapsed));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.turnStartTime, gameState.status]);

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    white: 'bg-white border border-gray-300',
    orange: 'bg-orange-500'
  };

  const isMyTurn = gameState.players[gameState.currentTurnIndex].id === playerId;
  const showBell = !isMyTurn && timeLeft < 10;
  const anyPlayerFinished = gameState.players.some(p => p.place !== null);
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const canGiveUp = anyPlayerFinished && myPlayer && myPlayer.place === null;

  // Filter out local player from the list as requested
  const otherPlayers = gameState.players.filter(p => p.id !== playerId);

  return (
    <div className="w-full desktop:w-64 bg-[#3A5214] backdrop-blur-sm shadow-md rounded-xl desktop:rounded-3xl p-4 tablet:p-6 tablet-landscape:p-2 mb-0 tablet:mb-6 tablet-landscape:mb-1 flex flex-col desktop:flex-col items-center justify-between desktop:justify-start gap-4 border-b tablet-landscape:border-b-0 desktop:border-b-0 desktop:border-l border-[#7DA33C]/40 desktop:h-full desktop:overflow-y-auto">
      <h3 className="hidden desktop:block text-xs font-black text-green-300 uppercase tracking-widest mb-2">Гравці</h3>
      <div className="flex desktop:flex-col gap-4 overflow-x-auto desktop:overflow-x-visible py-2 desktop:py-0 px-2 w-full scrollbar-hide">
        {otherPlayers.map((player) => {
          // Find original index in gameState.players for isCurrentTurn check
          const originalIdx = gameState.players.findIndex(p => p.id === player.id);
          const isCurrentTurn = originalIdx === gameState.currentTurnIndex;
          
          return (
            <div 
              key={player.id}
              className={`flex flex-col desktop:flex-col items-center p-3 desktop:p-4 rounded-2xl min-w-[120px] desktop:min-w-0 desktop:w-full transition-all gap-3
                ${isCurrentTurn ? 'bg-green-800 border-2 border-yellow-400 shadow-sm scale-105 z-10' : 'bg-green-900/40 border border-green-700/50 opacity-80'}
                ${player.place !== null ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 desktop:w-16 desktop:h-16 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 ${tokenColors[player.tokenColor]}`}>
                  <span className="text-white font-black text-xl">{player.name.charAt(0).toUpperCase()}</span>
                </div>
                {player.place !== null && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md z-20">
                    {player.place === 99 ? 'X' : player.place}
                  </div>
                )}
                {player.skipNextTurn && (
                  <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded shadow-sm">
                    ПРОПУСК
                  </div>
                )}
                {!player.connected && (
                  <div className="absolute -bottom-2 -left-2 bg-gray-500 text-white text-[10px] font-bold px-1 rounded shadow-sm">
                    OFF
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center min-w-0 flex-1">
                <span className="text-sm font-black text-green-50 truncate w-full text-center">
                  {player.name}
                </span>
                
                {isCurrentTurn && (
                  <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                    <Clock size={12} />
                    <span>{timeLeft}с</span>
                  </div>
                )}
                {player.missedTurns > 0 && player.place === null && (
                  <div className="text-[10px] font-bold text-orange-400 mt-1">
                    ⚠️ {player.missedTurns}/2
                  </div>
                )}
                {player.place === 99 && (
                  <div className="text-[10px] font-bold text-red-400 uppercase mt-1">Вибув</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t tablet-landscape:border-t-0 desktop:border-t-0 pt-4 desktop:pt-0 border-green-700/50 w-full desktop:mt-auto">
        {showBell && (
          <button 
            onClick={() => ringBell(gameState.players[gameState.currentTurnIndex].id)}
            className="flex items-center justify-center gap-2 bg-yellow-400 text-green-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition font-bold text-sm shadow-md"
          >
            <Bell size={16} className="animate-bounce" /> Дзвіночок
          </button>
        )}

        {canGiveUp && (
          <button 
            onClick={giveUp}
            className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-bold text-sm shadow-md"
          >
            <Flag size={16} /> Здаюсь
          </button>
        )}

        {cameraError && (
          <div className="flex flex-col gap-1 items-center justify-center text-[10px] text-red-300 font-bold bg-red-900/40 py-2 rounded">
            <div className="flex items-center gap-1">
              <VideoOff size={10} /> {cameraError}
            </div>
            <button 
              onClick={refreshCamera}
              className="mt-1 px-2 py-0.5 bg-red-700 hover:bg-red-600 rounded text-[8px] uppercase"
            >
              Спробувати знову
            </button>
          </div>
        )}
        
        {!cameraError && (
          <button 
            onClick={refreshCamera}
            className="flex items-center justify-center gap-1 text-[8px] text-green-300/60 hover:text-green-300 font-bold py-1"
          >
            <Video size={10} /> Оновити камеру
          </button>
        )}
      </div>
    </div>
  );
};
