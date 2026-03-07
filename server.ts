import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDeck, CATEGORIES, COLORS } from './src/data/deck';
import { Card, Player, GameState } from './src/types';
import bodyParser from 'body-parser';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const games: Record<string, GameState> = {};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

// JSON парсер
app.use(bodyParser.json());
app.use(cors());

  app.get('/favicon.ico', (req, res) => res.status(204).end());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', ({ name, tokenColor, age, playerId }, callback) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const pId = playerId || uuidv4();
      
      games[roomId] = {
        roomId,
        status: 'lobby',
        initiator: pId,
        players: [{
          id: pId,
          socketId: socket.id,
          name,
          tokenColor,
          age,
          position: 0,
          skipNextTurn: false,
          place: null,
          connected: true,
          lastActive: Date.now(),
          missedTurns: 0,
          isBot: false
        }],
        deck: generateDeck(),
        discardPile: [],
        currentTurnIndex: 0,
        phase: 'select',
        currentSelection: null,
        currentCard: null,
        expectedMoves: 0,
        turnStartTime: 0,
        placesAssigned: 0
      };
      
      socket.join(roomId);
      callback({ success: true, roomId, playerId: pId });
      io.to(roomId).emit('game_update', getPublicGameState(games[roomId]));
    });

    socket.on('join_room', ({ roomId, name, tokenColor, age, playerId }, callback) => {
      const game = games[roomId];
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (game.status !== 'lobby' && game.status !== 'paused') {
        // Check if reconnecting
        const existingPlayer = game.players.find(p => p.id === playerId);
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          existingPlayer.connected = true;
          existingPlayer.lastActive = Date.now();
          socket.join(roomId);
          callback({ success: true, playerId });
          io.to(roomId).emit('game_update', getPublicGameState(game));
          return;
        }
        return callback({ success: false, error: 'Game already started' });
      }
      
      if (game.players.length >= 6) return callback({ success: false, error: 'Room full' });
      if (game.players.some(p => p.tokenColor === tokenColor)) return callback({ success: false, error: 'Color taken' });
      if (game.players.some(p => p.name === name)) return callback({ success: false, error: 'Name taken' });

      const pId = playerId || uuidv4();
      game.players.push({
        id: pId,
        socketId: socket.id,
        name,
        tokenColor,
        age,
        position: 0,
        skipNextTurn: false,
        place: null,
        connected: true,
        lastActive: Date.now(),
        missedTurns: 0,
        isBot: false
      });
      
      socket.join(roomId);
      callback({ success: true, playerId: pId });
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('add_bot', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      if (game.initiator !== playerId) return;
      if (game.players.length >= 6) return;
      
      // Limit to 1 bot
      const botCount = game.players.filter(p => p.isBot).length;
      if (botCount >= 1) return;

      const botColors = COLORS.filter(c => !game.players.some(p => p.tokenColor === c));
      if (botColors.length === 0) return;

      const botColor = botColors[0];
      const botNames = ['Бот Альфа', 'Бот Бета', 'Бот Гамма', 'Бот Дельта', 'Бот Епсілон'];
      const availableNames = botNames.filter(n => !game.players.some(p => p.name === n));
      const botName = availableNames.length > 0 ? availableNames[0] : 'Бот ' + Math.floor(Math.random() * 1000);

      game.players.push({
        id: `bot_${uuidv4()}`,
        socketId: `bot_${uuidv4()}`,
        name: botName,
        tokenColor: botColor,
        age: Math.floor(Math.random() * 50) + 10,
        position: 0,
        skipNextTurn: false,
        place: null,
        connected: true,
        lastActive: Date.now(),
        missedTurns: 0,
        isBot: true
      });

      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('remove_bot', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      if (game.initiator !== playerId) return;

      const botIndex = game.players.findIndex(p => p.isBot);
      if (botIndex !== -1) {
        game.players.splice(botIndex, 1);
        io.to(roomId).emit('game_update', getPublicGameState(game));
      }
    });

    socket.on('start_game', ({ roomId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      
      // Final shuffle at game start
      for (let i = game.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
      }
      
      // Sort players by age for first game
      game.players.sort((a, b) => a.age - b.age);
      
      game.status = 'playing';
      game.turnStartTime = Date.now();
      io.to(roomId).emit('game_update', getPublicGameState(game));
      
      // Check if first player is a bot
      if (game.players[game.currentTurnIndex].isBot) {
        scheduleBotAction(game);
      }
    });

    socket.on('select_attributes', ({ roomId, playerId, category, color }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== playerId || game.phase !== 'select') return;
      
      currentPlayer.lastActive = Date.now();
      game.currentSelection = { category, color };
      game.phase = 'reveal';
      game.turnStartTime = Date.now();
      
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('reveal_card', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== playerId || game.phase !== 'reveal') return;
      
      currentPlayer.lastActive = Date.now();
      
      if (game.deck.length === 0) {
        game.deck = game.discardPile.sort(() => Math.random() - 0.5);
        game.discardPile = [];
      }
      
      // const card = game.deck.pop()!;
      let card = game.deck.pop();
if (!card) {
  if (game.discardPile.length > 0) {
    // Перемішати discardPile назад в deck
    game.deck = game.discardPile.sort(() => Math.random() - 0.5);
    game.discardPile = [];
    card = game.deck.pop();
  }
}

if (!card) {
  console.warn(`[Game ${roomId}] No cards left in deck or discard pile.`);
  return; // або зробити якусь fallback-логіку
}

      console.log(`[Game ${roomId}] Revealed card: ${card.itemUk} (${card.category}, ${card.colorUk}). Remaining in deck: ${game.deck.length}`);
      game.currentCard = card;
      
      // Compare
      let matches = 0;
      if (game.currentSelection?.category === card.category) matches++;
      if (game.currentSelection?.color === card.color) matches++;
      
      game.expectedMoves = matches === 2 ? 2 : matches === 1 ? 1 : 0;
      game.phase = 'action';
      game.turnStartTime = Date.now();
      
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('perform_action', ({ roomId, playerId, action }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== playerId || game.phase !== 'action') return;
      
      currentPlayer.lastActive = Date.now();
      
      let moves = 0;
      let skipNext = false;
      
      if (game.expectedMoves === 2) {
        if (action === 'move2') moves = 2;
        else { moves = 2; skipNext = true; }
      } else if (game.expectedMoves === 1) {
        if (action === 'move1') moves = 1;
        else { moves = 1; skipNext = true; }
      } else {
        if (action === 'pass') moves = 0;
        else { moves = 0; skipNext = true; }
      }
      
      currentPlayer.position = Math.min(20, currentPlayer.position + moves);
      currentPlayer.skipNextTurn = skipNext;
      
      if (currentPlayer.position === 20 && currentPlayer.place === null) {
        game.placesAssigned++;
        currentPlayer.place = game.placesAssigned;
      }
      
      if (game.currentCard) {
        game.discardPile.push(game.currentCard);
      }
      
      nextTurn(game);
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('give_up', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const player = game.players.find(p => p.id === playerId);
      if (player && player.place === null) {
        game.placesAssigned++;
        player.place = game.placesAssigned;
        
        // If it was their turn, move to next
        if (game.players[game.currentTurnIndex].id === playerId) {
          nextTurn(game);
        }
        io.to(roomId).emit('game_update', getPublicGameState(game));
      }
    });

    socket.on('leave_room', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game) return;

      const playerIndex = game.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        const player = game.players[playerIndex];
        
        if (game.status === 'playing' && player.place === null) {
          game.placesAssigned++;
          player.place = 99; // Left the game
          
          if (game.players[game.currentTurnIndex].id === playerId) {
            nextTurn(game);
          }
        } else if (game.status === 'lobby') {
          game.players.splice(playerIndex, 1);
          if (game.initiator === playerId && game.players.length > 0) {
            game.initiator = game.players[0].id;
          }
        }
        
        socket.leave(roomId);
        io.to(roomId).emit('game_update', getPublicGameState(game));
        
        // If no players left, delete game
        if (game.players.filter(p => !p.isBot).length === 0) {
          delete games[roomId];
        }
      }
    });

    socket.on('pause_game', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (game && game.initiator === playerId) {
        const wasPaused = game.status === 'paused';
        game.status = wasPaused ? 'playing' : 'paused';
        if (wasPaused) {
          game.turnStartTime = Date.now();
        }
        io.to(roomId).emit('game_update', getPublicGameState(game));
      }
    });

    socket.on('ring_bell', ({ roomId, targetPlayerId }) => {
      io.to(roomId).emit('play_bell', { targetPlayerId });
    });

    socket.on('player_activity', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id === playerId) {
        game.turnStartTime = Date.now();
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Find player and mark disconnected
      for (const roomId in games) {
        const game = games[roomId];
        const player = game.players.find(p => p.socketId === socket.id);
        if (player) {
          player.connected = false;
          io.to(roomId).emit('game_update', getPublicGameState(game));
        }
      }
    });
  });

  function scheduleBotAction(game: GameState) {
    if (game.status !== 'playing') return;
    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer.isBot) return;

    // Add a random delay to simulate thinking
    // Make the first step (select) much longer as requested (around 15-20s)
    let delay = Math.floor(Math.random() * 2000) + 1000;
    if (game.phase === 'select') {
      delay = 7000; 
    }

    setTimeout(() => {
      // Check if game state is still valid for this bot
      if (game.status !== 'playing') return;
      const currentP = game.players[game.currentTurnIndex];
      if (currentP.id !== currentPlayer.id) return;

      if (game.phase === 'select') {
        const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        currentP.lastActive = Date.now();
        game.currentSelection = { category: randomCategory, color: randomColor };
        game.phase = 'reveal';
        game.turnStartTime = Date.now();
        
        io.to(game.roomId).emit('game_update', getPublicGameState(game));
        scheduleBotAction(game);
      } else if (game.phase === 'reveal') {
        if (game.deck.length === 0) {
          // Reshuffle discard pile
          game.deck = [...game.discardPile];
          for (let i = game.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
          }
          game.discardPile = [];
        }
        
        const card = game.deck.pop()!;
        game.currentCard = card;
        
        let matches = 0;
        if (game.currentSelection?.category === card.category) matches++;
        if (game.currentSelection?.color === card.color) matches++;
        
        game.expectedMoves = matches === 2 ? 2 : matches === 1 ? 1 : 0;
        game.phase = 'action';
        game.turnStartTime = Date.now();
        
        io.to(game.roomId).emit('game_update', getPublicGameState(game));
        scheduleBotAction(game);
      } else if (game.phase === 'action') {
        // Bot always chooses the correct action
        let action: 'pass' | 'move1' | 'move2' = 'pass';
        if (game.expectedMoves === 2) action = 'move2';
        else if (game.expectedMoves === 1) action = 'move1';
        else action = 'pass';

        let moves = 0;
        let skipNext = false;
        
        if (game.expectedMoves === 2) {
          if (action === 'move2') moves = 2;
          else { moves = 2; skipNext = true; }
        } else if (game.expectedMoves === 1) {
          if (action === 'move1') moves = 1;
          else { moves = 1; skipNext = true; }
        } else {
          if (action === 'pass') moves = 0;
          else { moves = 0; skipNext = true; }
        }
        
        currentP.position = Math.min(20, currentP.position + moves);
        currentP.skipNextTurn = skipNext;
        
        if (currentP.position === 20 && currentP.place === null) {
          game.placesAssigned++;
          currentP.place = game.placesAssigned;
        }
        
        if (game.currentCard) {
          game.discardPile.push(game.currentCard);
        }
        
        nextTurn(game);
        io.to(game.roomId).emit('game_update', getPublicGameState(game));
      }
    }, delay);
  }

  function nextTurn(game: GameState) {
    game.phase = 'select';
    game.currentSelection = null;
    game.currentCard = null;
    game.expectedMoves = 0;
    
    let nextIndex = (game.currentTurnIndex + 1) % game.players.length;
    let loopCount = 0;
    
    // Check if all active players have skipNextTurn
    const activePlayers = game.players.filter(p => p.place === null);
    if (activePlayers.length > 0 && activePlayers.every(p => p.skipNextTurn)) {
      activePlayers.forEach(p => p.skipNextTurn = false);
    }
    
    while (loopCount < game.players.length) {
      const p = game.players[nextIndex];
      if (p.place !== null) {
        nextIndex = (nextIndex + 1) % game.players.length;
        loopCount++;
        continue;
      }
      if (p.skipNextTurn) {
        p.skipNextTurn = false;
        nextIndex = (nextIndex + 1) % game.players.length;
        loopCount++;
        continue;
      }
      break;
    }
    
    game.currentTurnIndex = nextIndex;
    game.turnStartTime = Date.now();
    
    // Check if game over
    if (game.players.filter(p => p.place === null).length <= 1) {
      game.status = 'finished';
      const lastPlayer = game.players.find(p => p.place === null);
      if (lastPlayer) {
        game.placesAssigned++;
        lastPlayer.place = game.placesAssigned;
      }
    } else {
      if (game.players[game.currentTurnIndex].isBot) {
        scheduleBotAction(game);
      }
    }
  }

  // Timer check interval
  setInterval(() => {
    const now = Date.now();
    for (const roomId in games) {
      const game = games[roomId];
      if (game.status === 'playing') {
        const currentPlayer = game.players[game.currentTurnIndex];
        if (now - game.turnStartTime > 45000) {
          // Auto skip turn
          currentPlayer.missedTurns++;
          if (currentPlayer.missedTurns >= 2) {
            // Kick player
            currentPlayer.place = 99; // Kicked
          } else {
            currentPlayer.skipNextTurn = true;
          }
          nextTurn(game);
          io.to(roomId).emit('game_update', getPublicGameState(game));
        }
      }
    }
  }, 5000);

  // Bot logic interval
  setInterval(() => {
    const now = Date.now();
    for (const roomId in games) {
      const game = games[roomId];
      if (game.status === 'playing') {
        const currentPlayer = game.players[game.currentTurnIndex];
        if (currentPlayer.isBot) {
          // Bot thinking time: wait at least 7s for the first phase, then shorter for others
          const minWait = game.phase === 'select' ? 7000 : 2000;
          if (now - game.turnStartTime > minWait) {
            if (game.phase === 'select') {
              const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
              const color = COLORS[Math.floor(Math.random() * COLORS.length)];
              
              currentPlayer.lastActive = Date.now();
              game.currentSelection = { category, color };
              game.phase = 'reveal';
              game.turnStartTime = Date.now();
              
              io.to(roomId).emit('game_update', getPublicGameState(game));
            } else if (game.phase === 'reveal') {
              currentPlayer.lastActive = Date.now();
              
              if (game.deck.length === 0) {
                // Reshuffle discard pile
                game.deck = [...game.discardPile];
                for (let i = game.deck.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
                }
                game.discardPile = [];
              }
              
              const card = game.deck.pop()!;
              game.currentCard = card;
              
              // Compare
              let matches = 0;
              if (game.currentSelection?.category === card.category) matches++;
              if (game.currentSelection?.color === card.color) matches++;
              
              game.expectedMoves = matches === 2 ? 2 : matches === 1 ? 1 : 0;
              game.phase = 'action';
              game.turnStartTime = Date.now();
              
              io.to(roomId).emit('game_update', getPublicGameState(game));
            } else if (game.phase === 'action') {
              currentPlayer.lastActive = Date.now();
              
              // Bot has a chance to make a mistake
              const makeMistake = Math.random() < 0.1; // 10% chance to make a mistake
              let action: 'pass' | 'move1' | 'move2' = 'pass';
              
              if (!makeMistake) {
                if (game.expectedMoves === 2) action = 'move2';
                else if (game.expectedMoves === 1) action = 'move1';
                else action = 'pass';
              } else {
                const actions: ('pass' | 'move1' | 'move2')[] = ['pass', 'move1', 'move2'];
                action = actions[Math.floor(Math.random() * actions.length)];
              }
              
              let moves = 0;
              let skipNext = false;
              
              if (game.expectedMoves === 2) {
                if (action === 'move2') moves = 2;
                else { moves = 2; skipNext = true; }
              } else if (game.expectedMoves === 1) {
                if (action === 'move1') moves = 1;
                else { moves = 1; skipNext = true; }
              } else {
                if (action === 'pass') moves = 0;
                else { moves = 0; skipNext = true; }
              }
              
              currentPlayer.position = Math.min(20, currentPlayer.position + moves);
              currentPlayer.skipNextTurn = skipNext;
              
              if (currentPlayer.position === 20 && currentPlayer.place === null) {
                game.placesAssigned++;
                currentPlayer.place = game.placesAssigned;
              }
              
              if (game.currentCard) {
                game.discardPile.push(game.currentCard);
              }
              
              nextTurn(game);
              io.to(roomId).emit('game_update', getPublicGameState(game));
            }
          }
        }
      }
    }
  }, 1000);

  function getPublicGameState(game: GameState) {
    // Hide deck details, only send count
    return {
      ...game,
      deckCount: game.deck.length,
      deck: undefined,
      discardPile: undefined,
      expectedMoves: undefined // Hide expected moves from client
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on http://localhost:' + PORT);
  });
}

startServer();
