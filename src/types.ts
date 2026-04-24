export type Card = {
  id: string;
  category: string;
  color: string;
  itemEn: string;
  itemSv: string;
  itemUk: string;
  colorEn: string;
  colorSv: string;
  colorUk: string;
  imageUrl: string | null;
};

export type Player = {
  id: string;
  socketId: string;
  name: string;
  tokenColor: string;
  age: number;
  position: number;
  skipNextTurn: boolean;
  place: number | null;
  connected: boolean;
  lastActive: number;
  missedTurns: number;
  isBot: boolean;
  isPaused?: boolean;
};

export type GameState = {
  roomId: string;
  status: 'lobby' | 'playing' | 'paused' | 'finished';
  initiator: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentTurnIndex: number;
  phase: 'select' | 'reveal' | 'action';
  currentSelection: { category: string, color: string } | null;
  currentCard: Card | null;
  expectedMoves: number;
  turnStartTime: number;
  placesAssigned: number;
  deckCount?: number; // Used in public state
};
