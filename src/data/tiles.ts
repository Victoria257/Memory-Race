export type TileType = 'start' | 'finish' | 'math' | 'action';

export type Tile = {
  id: number;
  type: TileType;
  label?: string;
  math?: string;
  action?: 'move_ahead_2' | 'lose_turn' | 'roll_again' | 'go_back_2';
  actionLabel?: string;
};

export const BOARD_TILES: Tile[] = [
  { id: 0, type: 'start', label: 'START' },
  { id: 1, type: 'math', math: '14+1' },
  { id: 2, type: 'math', math: '3+9' },
  { id: 3, type: 'math', math: '17+3' },
  { id: 4, type: 'math', math: '1+15' },
  { id: 5, type: 'action', action: 'move_ahead_2', actionLabel: 'MOVE AHEAD 2 SPACES' },
  { id: 6, type: 'math', math: '13+0' },
  { id: 7, type: 'math', math: '1+1' },
  { id: 8, type: 'action', action: 'lose_turn', actionLabel: 'LOSE A TURN' },
  { id: 9, type: 'math', math: '5+0' },
  { id: 10, type: 'math', math: '5+13' },
  { id: 11, type: 'math', math: '16+0' },
  { id: 12, type: 'math', math: '2+13' },
  { id: 13, type: 'math', math: '5+3' },
  { id: 14, type: 'math', math: '11+8' },
  { id: 15, type: 'math', math: '15+3' },
  { id: 16, type: 'math', math: '2+6' },
  { id: 17, type: 'action', action: 'roll_again', actionLabel: 'ROLL AGAIN' },
  { id: 18, type: 'math', math: '1+13' },
  { id: 19, type: 'math', math: '12+4' },
  { id: 20, type: 'math', math: '14+4' },
  { id: 21, type: 'action', action: 'go_back_2', actionLabel: 'GO BACK 2 SPACES' },
  { id: 22, type: 'math', math: '4+12' },
  { id: 23, type: 'math', math: '11+4' },
  { id: 24, type: 'math', math: '2+15' },
  { id: 25, type: 'math', math: '3+5' },
  { id: 26, type: 'math', math: '4+16' },
  { id: 27, type: 'finish', label: 'FINISH' },
];
