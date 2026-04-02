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
        peer = new Peer({
          initiator: shouldInitiate,
          trickle: true,
          stream: localStream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
              { urls: 'stun:stun.services.mozilla.com' },
            ],
            iceCandidatePoolSize: 10
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

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    white: 'bg-white border border-gray-300',
    orange: 'bg-orange-500'
  };

  return (
    <div className={`relative w-16 h-16 desktop:w-24 desktop:h-24 rounded-xl overflow-hidden shadow-inner border-2 border-white/50 ${tokenColors[player.tokenColor]} group`}>
      {player.isBot ? (
        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
          {player.name.charAt(0).toUpperCase()}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted={isMe}
            className={`w-full h-full object-cover ${isMe ? 'scale-x-[-1]' : ''}`}
          />
          
          {!isMe && !isConnected && player.connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mb-1" />
              <button 
                onClick={handleReconnect}
                className="text-[8px] font-bold text-white bg-green-600 px-1 rounded hover:bg-green-500 transition-colors"
              >
                ОНОВИТИ
              </button>
            </div>
          )}

          {!player.connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Offline</span>
            </div>
          )}
          
          {!isMe && !remoteStream && player.connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
              <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
