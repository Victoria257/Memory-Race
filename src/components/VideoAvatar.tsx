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
    if (isMe && localStream && videoRef.current) {
      console.log(`[WebRTC] Setting local stream for myself. Tracks:`, localStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      videoRef.current.srcObject = localStream;
    }
  }, [isMe, localStream]);

  useEffect(() => {
    if (videoRef.current && remoteStream && !isMe) {
      console.log(`[WebRTC] Setting remote stream for ${player.name}`);
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch(e => console.error("[WebRTC] Play error:", e));
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
    // Small delay to ensure both sides are ready
    const timeoutId = setTimeout(() => {
      const shouldInitiate = playerId < player.id;
      console.log(`[WebRTC] Initializing peer for ${player.name}, initiator: ${shouldInitiate}, retry: ${retryCount}, myId: ${playerId}, targetId: ${player.id}`);

      if (!localStream) {
        console.warn(`[WebRTC] No local stream available for ${player.name}`);
        return;
      }
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
            ]
          }
        });
      } catch (err) {
        console.error('[WebRTC] Failed to create Peer instance:', err);
        return;
      }

      peer.on('signal', (signal: any) => {
        console.log(`[WebRTC] Generated signal for ${player.name} (type: ${signal.type || 'candidate'})`);
        if (socket && socket.connected) {
          socket.emit('webrtc_signal', {
            roomId,
            targetId: player.id,
            senderId: playerId,
            signal,
          });
        } else {
          console.warn(`[WebRTC] Socket not connected, cannot send signal to ${player.name}`);
        }
      });

      peer.on('stream', (stream: any) => {
        console.log(`[WebRTC] Received remote stream from ${player.name}. Tracks:`, stream.getTracks().map((t: any) => `${t.kind}:${t.enabled}`));
        setRemoteStream(stream);
        setIsConnected(true);
        if (videoRef.current) {
          console.log(`[WebRTC] Attaching stream to video element for ${player.name}`);
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error(`[WebRTC] Play error for ${player.name}:`, e));
        }
      });

      peer.on('connect', () => {
        console.log(`[WebRTC] Connected to ${player.name}`);
        setIsConnected(true);
      });

      diagInterval = setInterval(() => {
        if (peer && peer._pc) {
          console.log(`[WebRTC] ${player.name} ICE: ${peer._pc.iceConnectionState}, Connection: ${peer._pc.connectionState}`);
        }
      }, 5000);

      peer.on('error', (err: any) => {
        console.error(`[WebRTC] Peer error with ${player.name}:`, err);
        setIsConnected(false);
      });

      peer.on('close', () => {
        console.log(`[WebRTC] Peer connection closed with ${player.name}`);
        setIsConnected(false);
      });

      const handleSignal = (data: any) => {
        if (data.targetId === playerId && data.senderId === player.id) {
          console.log(`[WebRTC] Received signal from ${player.name} (type: ${data.signal.type || 'candidate'}), applying to peer`);
          try {
            if (peer && !peer.destroyed) {
              peer.signal(data.signal);
            }
          } catch (err) {
            console.error(`[WebRTC] Error applying signal from ${player.name}:`, err);
          }
        }
      };

      socket.on('webrtc_signal', handleSignal);
      peerRef.current = peer;
    }, 1000);

    return () => {
      console.log(`[WebRTC] Cleaning up peer for ${player.name}`);
      clearTimeout(timeoutId);
      if (diagInterval) clearInterval(diagInterval);
      if (peerRef.current) {
        socket.off('webrtc_signal'); // Remove all signal listeners for this peer
        peerRef.current.destroy();
      }
      setIsConnected(false);
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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMe}
        onLoadedMetadata={(e) => (e.target as HTMLVideoElement).play()}
        className={`w-full h-full object-cover ${isMe ? 'scale-x-[-1]' : ''}`}
      />
      
      {!isMe && !isConnected && !player.isBot && player.connected && (
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

      {!player.connected && !player.isBot && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Offline</span>
        </div>
      )}
      
      {player.isBot ? (
         <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
           {player.name.charAt(0).toUpperCase()}
         </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMe}
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {!isMe && !remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
            </div>
          )}
          {!player.connected && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[8px] text-white font-bold uppercase">
              Offline
            </div>
          )}
        </>
      )}
    </div>
  );
};
