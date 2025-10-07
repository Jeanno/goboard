export type StoneColor = 'black' | 'white' | null;

export interface Position {
  row: number;
  col: number;
}

export interface BoardState {
  stones: StoneColor[][];
  boardSize: number;
  currentPlayer: 'black' | 'white';
  capturedStones: {
    black: number;
    white: number;
  };
  koPosition: Position | null;
  handicapStones: number;
  komi: number;
  history: StoneColor[][][];
  historyIndex: number;
}

export interface GameConfig {
  boardSize: number;
  handicapStones: number;
  komi: number;
}

export interface GameRecord {
  id: string;
  name: string;
  state: BoardState;
  createdAt: string;
  updatedAt: string;
}
