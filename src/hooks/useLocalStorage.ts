import { useEffect } from 'react';
import { BoardState } from '../types';

const STORAGE_KEY = 'goboard_game_state';

export function saveGameState(gameState: BoardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): BoardState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
  }
  return null;
}

export function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export function useAutoSave(gameState: BoardState) {
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);
}
