import { GameRecord, BoardState } from '../types';

const GAMES_LIST_KEY = 'goboard_games_list';
const CURRENT_GAME_ID_KEY = 'goboard_current_game_id';

export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateGameName(boardSize: number, handicap: number): string {
  const date = new Date().toLocaleString();
  if (handicap > 0) {
    return `${boardSize}x${boardSize} (H${handicap}) - ${date}`;
  }
  return `${boardSize}x${boardSize} - ${date}`;
}

export function saveGamesList(games: GameRecord[]): void {
  try {
    localStorage.setItem(GAMES_LIST_KEY, JSON.stringify(games));
  } catch (error) {
    console.error('Failed to save games list:', error);
  }
}

export function loadGamesList(): GameRecord[] {
  try {
    const saved = localStorage.getItem(GAMES_LIST_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load games list:', error);
  }
  return [];
}

export function saveGame(gameRecord: GameRecord): void {
  const games = loadGamesList();
  const existingIndex = games.findIndex(g => g.id === gameRecord.id);

  if (existingIndex >= 0) {
    games[existingIndex] = gameRecord;
  } else {
    games.push(gameRecord);
  }

  saveGamesList(games);
}

export function loadGame(gameId: string): GameRecord | null {
  const games = loadGamesList();
  return games.find(g => g.id === gameId) || null;
}

export function deleteGame(gameId: string): void {
  const games = loadGamesList();
  const filtered = games.filter(g => g.id !== gameId);
  saveGamesList(filtered);

  // If we deleted the current game, clear the current game ID
  if (getCurrentGameId() === gameId) {
    clearCurrentGameId();
  }
}

export function updateGameName(gameId: string, newName: string): void {
  const games = loadGamesList();
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.name = newName;
    game.updatedAt = new Date().toISOString();
    saveGamesList(games);
  }
}

export function setCurrentGameId(gameId: string): void {
  try {
    localStorage.setItem(CURRENT_GAME_ID_KEY, gameId);
  } catch (error) {
    console.error('Failed to set current game ID:', error);
  }
}

export function getCurrentGameId(): string | null {
  try {
    return localStorage.getItem(CURRENT_GAME_ID_KEY);
  } catch (error) {
    console.error('Failed to get current game ID:', error);
    return null;
  }
}

export function clearCurrentGameId(): void {
  try {
    localStorage.removeItem(CURRENT_GAME_ID_KEY);
  } catch (error) {
    console.error('Failed to clear current game ID:', error);
  }
}

export function createNewGame(state: BoardState, name?: string): GameRecord {
  const id = generateGameId();
  const gameName = name || generateGameName(state.boardSize, state.handicapStones);

  const gameRecord: GameRecord = {
    id,
    name: gameName,
    state,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveGame(gameRecord);
  setCurrentGameId(id);

  return gameRecord;
}

export function updateGameState(gameId: string, state: BoardState): void {
  const games = loadGamesList();
  const game = games.find(g => g.id === gameId);

  if (game) {
    game.state = state;
    game.updatedAt = new Date().toISOString();
    saveGamesList(games);
  }
}
