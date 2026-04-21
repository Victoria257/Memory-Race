import React, { useEffect, useRef, useState } from 'react';
import _Peer from 'simple-peer';
import { useStore } from '../store';
import { Player } from '../types';

const Peer = (_Peer as any).default || _Peer;

interface VideoAvatarProps {
  player: Player;
  localStream: MediaStream | null;
}

export const VideoAvatar: React.FC<VideoAvatarProps> = ({ player, localStream }) => {
  const { socket, playerId, gameState } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const peerRef = useRef<any>(null);

  const isMe = player.id === playerId;

  useEffect(() => {
    const video = videoRef.current;
    if (isMe && localStream && video) {
      if (video.srcObject !== localStream) {
        console.log(`[WebRTC] Setting local stream for myself`);
        video.srcObject = localStream;
        video.play().catch(e => {
          if (e.name !== 'AbortError') console.warn("[WebRTC] Local video play error:", e);
        });
      }
    }
  }, [isMe, localStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && remoteStream && !isMe) {
      if (video.srcObject !== remoteStream) {
        console.log(`[WebRTC] Setting remote stream for ${player.name}`);
        video.srcObject = remoteStream;
        video.play().catch(e => {
          if (e.name !== 'AbortError') console.error("[WebRTC] Remote play error:", e);
        });
      }
    }
  }, [remoteStream, isMe, player.name]);

  useEffect(() => {
    const roomId = gameState?.roomId;
    if (isMe || !localStream || !socket || !roomId || !playerId || player.isBot || !player.connected) {
      setIsConnected(false);
      return;
    }

    let diagInterval: any;
    let peer: any;
    const signalBuffer: any[] = [];

    const handleSignal = (data: any) => {
      if (data.targetId === playerId && data.senderId === player.id) {
        console.log(`[WebRTC] Received signal from ${player.name} (type: ${data.signal.type || 'candidate'})`);
        if (peer && !peer.destroyed) {
          try {
            peer.signal(data.signal);
          } catch (err) {
            console.error(`[WebRTC] Error applying signal from ${player.name}:`, err);
          }
        } else {
          console.log(`[WebRTC] Peer not ready for ${player.name}, buffering signal`);
          signalBuffer.push(data.signal);
        }
      }
    };

    socket.on('webrtc_signal', handleSignal);

    // Small delay to ensure both sides have the listener active
    const timeoutId = setTimeout(() => {
      if (!localStream || !localStream.active) {
        console.warn(`[WebRTC] Local stream not active for ${player.name}, aborting peer init`);
        return;
      }

      const shouldInitiate = playerId < player.id;
      console.log(`[WebRTC] Initializing peer for ${player.name}, initiator: ${shouldInitiate}, retry: ${retryCount}`);

      try {
        // TURN server configuration provided by user
        const turnUrl = "turn:standard.relay.metered.ca:80?transport=tcp";
        const turnUser = "9ecb38a92a21f037d126933c";
        const turnPass = "LnYRqT7U7wCRB09W";

        const iceServers: any[] = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.stunprotocol.org' },
          { urls: 'stun:stun.voipstunt.com' },
          { urls: 'stun:stun.ekiga.net' },
          { urls: 'stun:stun.ideasip.com' },
          { urls: 'stun:stun.schlund.de' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          {
            urls: turnUrl,
            username: turnUser,
            credential: turnPass
          }
        ];

        peer = new Peer({
          initiator: shouldInitiate,
          trickle: true,
          stream: localStream,
          config: {
            iceServers,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
          }
        });

        // Apply buffered signals with a tiny delay to ensure peer is ready
        if (signalBuffer.length > 0) {
          setTimeout(() => {
            while (signalBuffer.length > 0) {
              const sig = signalBuffer.shift();
              console.log(`[WebRTC] Applying buffered signal to ${player.name} (type: ${sig.type || 'candidate'})`);
              if (peer && !peer.destroyed) {
                try {
                  peer.signal(sig);
                } catch (e) {
                  console.error(`[WebRTC] Error applying buffered signal:`, e);
                }
              }
            }
          }, 100);
        }
      } catch (err) {
        console.error('[WebRTC] Failed to create Peer instance:', err);
        return;
      }

      peer.on('signal', (signal: any) => {
        if (socket && socket.connected) {
          socket.emit('webrtc_signal', {
            roomId,
            targetId: player.id,
            senderId: playerId,
            signal,
          });
        }
      });

      peer.on('stream', (stream: any) => {
        console.log(`[WebRTC] Received remote stream from ${player.name}`);
        setRemoteStream(stream);
        setIsConnected(true);
      });

      peer.on('connect', () => {
        console.log(`[WebRTC] Connected to ${player.name}`);
        setIsConnected(true);
      });

      diagInterval = setInterval(() => {
        if (peer && peer._pc) {
          const state = peer._pc.iceConnectionState;
          if (state === 'failed' || state === 'disconnected') {
            console.warn(`[WebRTC] Connection ${state} for ${player.name}, retrying...`);
            handleReconnect();
          }
        }
      }, 10000);

      peer.on('error', (err: any) => {
        console.error(`[WebRTC] Peer error with ${player.name}:`, err);
        setIsConnected(false);
      });

      peerRef.current = peer;
    }, 1500); // Increased delay for better synchronization

    return () => {
      clearTimeout(timeoutId);
      if (diagInterval) clearInterval(diagInterval);
      socket.off('webrtc_signal', handleSignal); 
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setIsConnected(false);
      setRemoteStream(null);
    };
  }, [isMe, localStream, socket, gameState?.roomId, player.id, playerId, player.isBot, player.connected, retryCount]);

  const handleReconnect = () => {
    console.log(`[WebRTC] Manual reconnect triggered for ${player.name}`);
    setRetryCount(prev => prev + 1);
  };

  const isCurrentTurn = gameState?.players[gameState.currentTurnIndex]?.id === player.id;
  const [timeLeft, setTimeLeft] = useState(40);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCurrentTurn && gameState?.status === 'playing') {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
        setTimeLeft(Math.max(0, 40 - elapsed));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCurrentTurn, gameState?.turnStartTime, gameState?.status]);

  const tokenBorderColors: Record<string, string> = {
    blue: 'border-blue-500',
    yellow: 'border-yellow-400',
    green: 'border-green-500',
    purple: 'border-purple-500',
    white: 'border-gray-200',
    orange: 'border-orange-500'
  };

  const turnGlowColors: Record<string, string> = {
    blue: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]',
    yellow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    white: 'shadow-[0_0_20px_rgba(255,255,255,0.6)]',
    orange: 'shadow-[0_0_20px_rgba(249,115,22,0.6)]'
  };

  return (
    <div className={`relative w-28 h-36 desktop:w-36 desktop:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 ${tokenBorderColors[player.tokenColor] || 'border-white/20'} ${isCurrentTurn ? turnGlowColors[player.tokenColor] : ''} bg-gray-900 group transition-all duration-300 ${player.place !== null ? 'opacity-40 grayscale' : ''}`}>
      {player.isBot ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-black relative">
          <img 
            src={`https://robohash.org/${player.id}?set=set1&bgset=bg2&size=200x200`} 
            alt="Bot Avatar"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1 flex flex-col items-center backdrop-blur-sm border-t border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-90">{player.name}</span>
            <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter italic">AI Бот</span>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted={isMe}
            className={`w-full h-full object-cover ${isMe ? 'scale-x-[-1]' : ''}`}
          />
          
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full text-[9px] text-white font-black uppercase tracking-wider backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${player.connected ? 'bg-green-500' : 'bg-gray-500'}`} />
            {isMe ? 'Ви' : player.name}
          </div>

          {isCurrentTurn && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-full border border-white/20 animate-pulse">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              <span className={`text-[10px] font-black ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}с</span>
            </div>
          )}

          {player.place !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <div className="bg-yellow-400 text-yellow-900 text-lg font-black w-10 h-10 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                {player.place === 99 ? 'X' : player.place}
              </div>
            </div>
          )}

          {player.skipNextTurn && player.place === null && (
            <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm">
              Пропуск ходу
            </div>
          )}

          {!isMe && !isConnected && player.connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mb-2" />
              <button 
                onClick={handleReconnect}
                className="text-[10px] font-bold text-white bg-green-600 px-2 py-1 rounded-lg hover:bg-green-500 transition-colors shadow-lg"
              >
                ОНОВИТИ
              </button>
            </div>
          )}

          {!player.connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-red-500/80 px-2 py-1 rounded">Offline</span>
            </div>
          )}
          
          {!isMe && !remoteStream && player.connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
          )}

          {/* Player status indicator */}
          <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${player.connected ? 'bg-green-500' : 'bg-gray-500'}`} />
        </>
      )}
    </div>
  );
};
