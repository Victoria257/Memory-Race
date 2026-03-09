import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { useStore } from '../store';
import { Player } from '../types';

interface VideoAvatarProps {
  player: Player;
  localStream: MediaStream | null;
}

export const VideoAvatar: React.FC<VideoAvatarProps> = ({ player, localStream }) => {
  const { socket, playerId, gameState } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  const isMe = player.id === playerId;

  useEffect(() => {
    if (isMe && localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [isMe, localStream]);

  useEffect(() => {
    if (isMe || !localStream || !socket || !gameState || player.isBot || !player.connected) return;

    // We only want one peer connection between two players.
    // Convention: player with "smaller" ID initiates.
    const shouldInitiate = playerId! < player.id;

    const peer = new Peer({
      initiator: shouldInitiate,
      trickle: false,
      stream: localStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });

    peer.on('signal', (signal) => {
      socket.emit('webrtc_signal', {
        roomId: gameState.roomId,
        targetId: player.id,
        senderId: playerId,
        signal,
      });
    });

    peer.on('stream', (stream) => {
      setRemoteStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    const handleSignal = (data: any) => {
      if (data.targetId === playerId && data.senderId === player.id) {
        peer.signal(data.signal);
      }
    };

    socket.on('webrtc_signal', handleSignal);
    peerRef.current = peer;

    return () => {
      socket.off('webrtc_signal', handleSignal);
      peer.destroy();
    };
  }, [isMe, localStream, socket, gameState, player.id, playerId, player.isBot, player.connected]);

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    white: 'bg-white border border-gray-300',
    orange: 'bg-orange-500'
  };

  return (
    <div className={`relative w-16 h-16 desktop:w-24 desktop:h-24 rounded-xl overflow-hidden shadow-inner border-2 border-white/50 ${tokenColors[player.tokenColor]}`}>
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
