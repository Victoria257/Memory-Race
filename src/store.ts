import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Player, Card, GameState } from './types.js';

interface AppState {
  socket: Socket | null;
  playerId: string | null;
  playerName: string;
  playerAge: number;
  playerTokenColor: string;
  language: 'en' | 'sv' | 'uk';
  isMuted: boolean;
  isOthersMuted: boolean;
  gameState: GameState | null;
  error: string | null;
  localStream: MediaStream | null;
  cameraError: string | null;
  
  initSocket: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setCameraError: (error: string | null) => void;
  setPlayerInfo: (name: string, age: number, color: string) => void;
  setLanguage: (lang: 'en' | 'sv' | 'uk') => void;
  toggleMute: () => void;
  toggleOthersMute: () => void;
  createGame: () => void;
  joinGame: (roomId: string) => void;
  startGame: () => void;
  selectAttributes: (category: string, color: string) => void;
  revealCard: () => void;
  performAction: (action: 'pass' | 'move1' | 'move2') => void;
  giveUp: () => void;
  leaveRoom: () => void;
  pauseGame: () => void;
  ringBell: (targetPlayerId: string) => void;
  addBot: () => void;
  removeBot: () => void;
  reportActivity: () => void;
  unpausePlayer: () => void;
  reconnectMedia: () => void;
  clearError: () => void;
}

// const socketUrl = (import.meta as any).env?.VITE_APP_URL || window.location.origin;
const socketUrl =
  import.meta.env.VITE_APP_URL || window.location.origin;

export const useStore = create<AppState>((set, get) => ({
  socket: null,
  playerId: localStorage.getItem('playerId') || null,
  playerName: localStorage.getItem('playerName') || '',
  playerAge: parseInt(localStorage.getItem('playerAge') || '18', 10),
  playerTokenColor: localStorage.getItem('playerTokenColor') || 'blue',
  language: (localStorage.getItem('language') as 'en' | 'sv' | 'uk') || 'uk',
  isMuted: localStorage.getItem('isMuted') === 'true',
  isOthersMuted: localStorage.getItem('isOthersMuted') === 'true',
  gameState: null,
  error: null,
  localStream: null,
  cameraError: null,
  
  setLocalStream: (stream) => set({ localStream: stream }),
  setCameraError: (error) => set({ cameraError: error }),

  initSocket: () => {
    if (get().socket) return;
    
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true
    });
    
    socket.on('connect', () => {
      console.log('Connected to server, socketId:', socket.id);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socket.on('game_update', (state: GameState) => {
      set({ gameState: state });
    });

    socket.on('play_bell', ({ targetPlayerId }) => {
      if (get().playerId === targetPlayerId) {
        // Play synthetic bell sound
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
          gain.gain.setValueAtTime(1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1);
        } catch (e) {
          console.error('Audio error', e);
        }
      }
    });

    set({ socket });
  },

  setPlayerInfo: (name, age, color) => {
    localStorage.setItem('playerName', name);
    localStorage.setItem('playerAge', age.toString());
    localStorage.setItem('playerTokenColor', color);
    set({ playerName: name, playerAge: age, playerTokenColor: color });
  },

  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },

  toggleMute: () => {
    const newMuted = !get().isMuted;
    localStorage.setItem('isMuted', newMuted.toString());
    set({ isMuted: newMuted });
  },

  toggleOthersMute: () => {
    const newMuted = !get().isOthersMuted;
    localStorage.setItem('isOthersMuted', newMuted.toString());
    set({ isOthersMuted: newMuted });
  },

  createGame: () => {
    const { socket, playerName, playerAge, playerTokenColor, playerId } = get();
    if (!socket) return;
    
    socket.emit('create_room', { name: playerName, age: playerAge, tokenColor: playerTokenColor, playerId }, (res: any) => {
      if (res.success) {
        localStorage.setItem('playerId', res.playerId);
        set({ playerId: res.playerId });
      } else {
        set({ error: res.error });
      }
    });
  },

  joinGame: (roomId) => {
    const { socket, playerName, playerAge, playerTokenColor, playerId } = get();
    if (!socket) return;
    
    socket.emit('join_room', { roomId, name: playerName, age: playerAge, tokenColor: playerTokenColor, playerId }, (res: any) => {
      if (res.success) {
        localStorage.setItem('playerId', res.playerId);
        set({ playerId: res.playerId });
      } else {
        set({ error: res.error });
      }
    });
  },

  startGame: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('start_game', { roomId: gameState.roomId });
  },

  selectAttributes: (category, color) => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('select_attributes', { roomId: gameState.roomId, playerId, category, color });
  },

  revealCard: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('reveal_card', { roomId: gameState.roomId, playerId });
  },

  performAction: (action) => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('perform_action', { roomId: gameState.roomId, playerId, action });
  },

  giveUp: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('give_up', { roomId: gameState.roomId, playerId });
  },

  leaveRoom: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('leave_room', { roomId: gameState.roomId, playerId });
  },

  pauseGame: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('pause_game', { roomId: gameState.roomId, playerId });
  },

  ringBell: (targetPlayerId) => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    socket.emit('ring_bell', { roomId: gameState.roomId, targetPlayerId });
  },

  addBot: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('add_bot', { roomId: gameState.roomId, playerId });
  },

  removeBot: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('remove_bot', { roomId: gameState.roomId, playerId });
  },

  reportActivity: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('player_activity', { roomId: gameState.roomId, playerId });
  },

  unpausePlayer: () => {
    const { socket, gameState, playerId } = get();
    if (!socket || !gameState || !playerId) return;
    socket.emit('unpause_player', { roomId: gameState.roomId, playerId });
  },

  reconnectMedia: async () => {
    const { localStream, setLocalStream, setCameraError } = get();
    
    // Reset first to force clean state
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    
    // Short delay to let browser release hardware
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      setLocalStream(stream);
      setCameraError(null);
      console.log("Media reconnected successfully");
    } catch (err) {
      console.error("Camera reconnection error:", err);
      // Fallback to audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioStream);
        setCameraError("Лише аудіо - камера недоступна");
      } catch (e) {
        setCameraError("Помилка доступу до медіа. Перевірте дозволи у браузері.");
      }
    }
  },

  clearError: () => set({ error: null })
}));
