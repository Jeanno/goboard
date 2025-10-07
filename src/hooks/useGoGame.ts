import { useState, useCallback } from 'react';
import { BoardState, Position, GameConfig } from '../types';
import {
  createEmptyBoard,
  copyBoard,
  isValidMove,
  getCapturedGroups,
} from '../utils/goRules';

export function useGoGame(config: GameConfig) {
  const [gameState, setGameState] = useState<BoardState>(() => {
    const board = createEmptyBoard(config.boardSize);

    // TODO: Place handicap stones if needed
    // Handicap stones are typically placed at star points

    return {
      stones: board,
      boardSize: config.boardSize,
      currentPlayer: config.handicapStones > 0 ? 'white' : 'black',
      capturedStones: { black: 0, white: 0 },
      koPosition: null,
      handicapStones: config.handicapStones,
      komi: config.komi,
      history: [copyBoard(board)],
    };
  });

  const placeStone = useCallback((pos: Position): boolean => {
    const { stones, currentPlayer, koPosition, boardSize } = gameState;

    // Validate move
    const validation = isValidMove(stones, pos, currentPlayer, koPosition, boardSize);
    if (!validation.valid) {
      console.log('Invalid move:', validation.reason);
      return false;
    }

    // Create new board state
    const newBoard = copyBoard(stones);
    newBoard[pos.row][pos.col] = currentPlayer;

    // Capture opponent stones
    const opponentColor = currentPlayer === 'black' ? 'white' : 'black';
    const capturedGroups = getCapturedGroups(newBoard, opponentColor, boardSize);

    let capturedCount = 0;
    let newKoPosition: Position | null = null;

    capturedGroups.forEach(group => {
      capturedCount += group.length;
      group.forEach(p => {
        newBoard[p.row][p.col] = null;
      });
    });

    // Check for ko: if exactly one stone was captured, record position
    if (capturedCount === 1 && capturedGroups.length === 1) {
      newKoPosition = capturedGroups[0][0];
    }

    // Update game state
    setGameState(prev => ({
      ...prev,
      stones: newBoard,
      currentPlayer: currentPlayer === 'black' ? 'white' : 'black',
      capturedStones: {
        ...prev.capturedStones,
        [opponentColor]: prev.capturedStones[opponentColor] + capturedCount,
      },
      koPosition: newKoPosition,
      history: [...prev.history, copyBoard(newBoard)],
    }));

    return true;
  }, [gameState]);

  const resetGame = useCallback(() => {
    const board = createEmptyBoard(config.boardSize);
    setGameState({
      stones: board,
      boardSize: config.boardSize,
      currentPlayer: config.handicapStones > 0 ? 'white' : 'black',
      capturedStones: { black: 0, white: 0 },
      koPosition: null,
      handicapStones: config.handicapStones,
      komi: config.komi,
      history: [copyBoard(board)],
    });
  }, [config]);

  const undo = useCallback(() => {
    setGameState(prev => {
      if (prev.history.length <= 1) return prev;

      const newHistory = prev.history.slice(0, -1);
      const previousBoard = newHistory[newHistory.length - 1];

      return {
        ...prev,
        stones: copyBoard(previousBoard),
        currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
        koPosition: null, // Reset ko position on undo
        history: newHistory,
      };
    });
  }, []);

  return {
    gameState,
    placeStone,
    resetGame,
    undo,
  };
}
