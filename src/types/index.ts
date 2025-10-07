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
}

export interface GameConfig {
  boardSize: number;
  handicapStones: number;
  komi: number;
}
