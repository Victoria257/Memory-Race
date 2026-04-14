import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Bell, Clock, Flag, Video, VideoOff } from 'lucide-react';
import { VideoAvatar } from './VideoAvatar';

export const PlayerList = () => {
  const { gameState, playerId, ringBell, giveUp } = useStore();
  const [timeLeft, setTimeLeft] = useState(40);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  if (!gameState) return null;

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      if (isCameraStarting) return;
      setIsCameraStarting(true);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
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
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Камера недоступна");
      } finally {
        setIsCameraStarting(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  return (
    <div className="w-full bg-[#3A5214]/40 backdrop-blur-sm p-2 tablet:p-4 flex flex-row items-center justify-between desktop:justify-end gap-4 border-b border-[#7DA33C]/20 z-30 overflow-x-auto scrollbar-hide">
      <div className="flex flex-row gap-4 py-2 px-2 scrollbar-hide items-center">
        {gameState.players.map((player, idx) => {
          const isCurrentTurn = idx === gameState.currentTurnIndex;
          
          return (
            <div 
              key={player.id}
              className={`flex flex-col items-center p-2 rounded-2xl transition-all gap-2
                ${isCurrentTurn ? 'bg-green-800 border-2 border-yellow-400 shadow-lg scale-105 z-10' : 'bg-green-900/40 border border-green-700/50 opacity-90'}
                ${player.place !== null ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <VideoAvatar key={`${player.id}-${playerId}`} player={player} localStream={localStream} />
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
              </div>
              
              <div className="flex flex-col items-center min-w-0">
                <span className="text-[10px] desktop:text-xs font-black text-green-50 truncate max-w-[80px] desktop:max-w-[100px] text-center">
                  {player.name}
                </span>
                
                {isCurrentTurn && (
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                    <Clock size={10} />
                    <span>{timeLeft}с</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col tablet:flex-row gap-2 ml-auto desktop:ml-6 flex-shrink-0">
        {showBell && (
          <button 
            onClick={() => ringBell(gameState.players[gameState.currentTurnIndex].id)}
            className="flex items-center justify-center bg-yellow-400 text-green-900 p-2 rounded-lg hover:bg-yellow-500 transition shadow-md"
            title="Дзвіночок"
          >
            <Bell size={16} className="animate-bounce" />
          </button>
        )}

        {canGiveUp && (
          <button 
            onClick={giveUp}
            className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition shadow-md"
            title="Здаюсь"
          >
            <Flag size={16} />
          </button>
        )}

        {cameraError ? (
          <button 
            onClick={refreshCamera}
            className="flex items-center justify-center bg-red-700 text-white p-2 rounded-lg hover:bg-red-600 transition shadow-md"
            title={cameraError}
          >
            <VideoOff size={16} />
          </button>
        ) : (
          <button 
            onClick={refreshCamera}
            className="flex items-center justify-center text-green-300/60 hover:text-green-300 p-2 transition"
            title="Оновити камеру"
          >
            <Video size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
