import { PlayerColor, Position, StoneColor } from '../types';

export function createEmptyBoard(size: number): StoneColor[][] {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

export function copyBoard(board: StoneColor[][]): StoneColor[][] {
  return board.map(row => [...row]);
}

export function getAdjacentPositions(pos: Position, boardSize: number): Position[] {
  const { row, col } = pos;
  const adjacent: Position[] = [];

  if (row > 0) adjacent.push({ row: row - 1, col });
  if (row < boardSize - 1) adjacent.push({ row: row + 1, col });
  if (col > 0) adjacent.push({ row, col: col - 1 });
  if (col < boardSize - 1) adjacent.push({ row, col: col + 1 });

  return adjacent;
}

export function getGroup(
  board: StoneColor[][],
  pos: Position,
  boardSize: number
): Position[] {
  const color = board[pos.row][pos.col];
  if (!color) return [];

  const group: Position[] = [];
  const visited = new Set<string>();

  function dfs(p: Position) {
    const key = `${p.row},${p.col}`;
    if (visited.has(key)) return;
    visited.add(key);

    if (board[p.row][p.col] === color) {
      group.push(p);
      getAdjacentPositions(p, boardSize).forEach(adj => dfs(adj));
    }
  }

  dfs(pos);
  return group;
}

export function hasLiberties(
  board: StoneColor[][],
  group: Position[]
): boolean {
  const boardSize = board.length;

  for (const pos of group) {
    const adjacent = getAdjacentPositions(pos, boardSize);
    for (const adj of adjacent) {
      if (board[adj.row][adj.col] === null) {
        return true;
      }
    }
  }

  return false;
}

export function getCapturedGroups(
  board: StoneColor[][],
  color: StoneColor,
  boardSize: number
): Position[][] {
  const capturedGroups: Position[][] = [];
  const visited = new Set<string>();

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const key = `${row},${col}`;
      if (visited.has(key) || board[row][col] !== color) continue;

      const group = getGroup(board, { row, col }, boardSize);
      group.forEach(p => visited.add(`${p.row},${p.col}`));

      if (!hasLiberties(board, group)) {
        capturedGroups.push(group);
      }
    }
  }

  return capturedGroups;
}

export function isValidMove(
  board: StoneColor[][],
  pos: Position,
  color: 'black' | 'white',
  koPosition: Position | null,
  boardSize: number
): { valid: boolean; reason?: string } {
  // Position must be empty
  if (board[pos.row][pos.col] !== null) {
    return { valid: false, reason: 'Position is occupied' };
  }

  // Check ko rule
  if (koPosition && koPosition.row === pos.row && koPosition.col === pos.col) {
    return { valid: false, reason: 'Ko rule violation' };
  }

  // Create temporary board with the new stone
  const tempBoard = copyBoard(board);
  tempBoard[pos.row][pos.col] = color;

  // Check if move captures opponent stones
  const opponentColor = color === 'black' ? 'white' : 'black';
  const capturedGroups = getCapturedGroups(tempBoard, opponentColor, boardSize);

  // Remove captured stones from temp board
  capturedGroups.forEach(group => {
    group.forEach(p => {
      tempBoard[p.row][p.col] = null;
    });
  });

  // Check if the placed stone has liberties (suicide rule)
  const placedGroup = getGroup(tempBoard, pos, boardSize);
  if (!hasLiberties(tempBoard, placedGroup)) {
    return { valid: false, reason: 'Suicide move (no liberties)' };
  }

  return { valid: true };
}

export function applyMoveToBoard(
  board: StoneColor[][],
  move: { row: number; col: number; color: PlayerColor },
  boardSize: number,
): { capturedCount: number; ko: Position | null } {
  board[move.row][move.col] = move.color;
  const opp: PlayerColor = move.color === 'black' ? 'white' : 'black';
  const groups = getCapturedGroups(board, opp, boardSize);

  let capturedCount = 0;
  for (const g of groups) {
    capturedCount += g.length;
    for (const p of g) board[p.row][p.col] = null;
  }

  const ko = capturedCount === 1 && groups.length === 1 ? groups[0][0] : null;
  return { capturedCount, ko };
}

export function boardsEqual(board1: StoneColor[][], board2: StoneColor[][]): boolean {
  if (board1.length !== board2.length) return false;

  for (let i = 0; i < board1.length; i++) {
    for (let j = 0; j < board1[i].length; j++) {
      if (board1[i][j] !== board2[i][j]) return false;
    }
  }

  return true;
}
