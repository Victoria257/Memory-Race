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
  gameState: GameState | null;
  error: string | null;
  
  initSocket: () => void;
  setPlayerInfo: (name: string, age: number, color: string) => void;
  setLanguage: (lang: 'en' | 'sv' | 'uk') => void;
  toggleMute: () => void;
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
  gameState: null,
  error: null,

  initSocket: () => {
    if (get().socket) return;
    
    const socket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false
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

  clearError: () => set({ error: null })
}));
