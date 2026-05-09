import { useState, useCallback, useEffect } from 'react';
import { BoardState, Position, GameConfig } from '../types';
import {
  applyMoveToBoard,
  createEmptyBoard,
  copyBoard,
  isValidMove,
} from '../utils/goRules';
import { getHandicapPositions } from '../utils/handicap';
import {
  getCurrentGameId,
  loadGame,
  updateGameState,
  createNewGame as createNewGameRecord,
} from '../utils/gameStorage';

export function useGoGame(config: GameConfig) {
  const [currentGameId, setCurrentGameId] = useState<string | null>(() => getCurrentGameId());

  const [gameState, setGameState] = useState<BoardState>(() => {
    // Try to load the current game from storage
    const gameId = getCurrentGameId();
    if (gameId) {
      const savedGame = loadGame(gameId);
      if (
        savedGame &&
        savedGame.state.boardSize === config.boardSize &&
        savedGame.state.handicapStones === config.handicapStones &&
        savedGame.state.komi === config.komi
      ) {
        return savedGame.state;
      }
    }

    // Otherwise, create a new board
    const board = createEmptyBoard(config.boardSize);

    // Place handicap stones if needed
    if (config.handicapStones > 0) {
      const handicapPositions = getHandicapPositions(config.boardSize, config.handicapStones);
      handicapPositions.forEach(pos => {
        board[pos.row][pos.col] = 'black';
      });
    }

    const newState: BoardState = {
      stones: board,
      boardSize: config.boardSize,
      currentPlayer: config.handicapStones > 0 ? 'white' : 'black',
      capturedStones: { black: 0, white: 0 },
      koPosition: null,
      handicapStones: config.handicapStones,
      komi: config.komi,
      history: [copyBoard(board)],
      historyIndex: 0,
    };

    // Create a new game record
    const newGame = createNewGameRecord(newState);
    setCurrentGameId(newGame.id);

    return newState;
  });

  // Auto-save to local storage whenever game state changes
  useEffect(() => {
    if (currentGameId) {
      updateGameState(currentGameId, gameState);
    }
  }, [gameState, currentGameId]);

  const placeStone = useCallback((pos: Position): boolean => {
    const { stones, currentPlayer, koPosition, boardSize, history, historyIndex } = gameState;

    // Validate move
    const validation = isValidMove(stones, pos, currentPlayer, koPosition, boardSize);
    if (!validation.valid) {
      console.log('Invalid move:', validation.reason);
      return false;
    }

    const newBoard = copyBoard(stones);
    const { capturedCount, ko: newKoPosition } = applyMoveToBoard(
      newBoard,
      { row: pos.row, col: pos.col, color: currentPlayer },
      boardSize,
    );
    const opponentColor = currentPlayer === 'black' ? 'white' : 'black';

    // If we're not at the end of history, truncate the future moves
    const newHistory = historyIndex < history.length - 1
      ? history.slice(0, historyIndex + 1)
      : history;

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
      history: [...newHistory, copyBoard(newBoard)],
      historyIndex: newHistory.length,
    }));

    return true;
  }, [gameState]);

  const resetGame = useCallback((newConfig?: GameConfig) => {
    const gameConfig = newConfig || config;
    const board = createEmptyBoard(gameConfig.boardSize);

    // Place handicap stones if needed
    if (gameConfig.handicapStones > 0) {
      const handicapPositions = getHandicapPositions(gameConfig.boardSize, gameConfig.handicapStones);
      handicapPositions.forEach(pos => {
        board[pos.row][pos.col] = 'black';
      });
    }

    const newState: BoardState = {
      stones: board,
      boardSize: gameConfig.boardSize,
      currentPlayer: gameConfig.handicapStones > 0 ? 'white' : 'black',
      capturedStones: { black: 0, white: 0 },
      koPosition: null,
      handicapStones: gameConfig.handicapStones,
      komi: gameConfig.komi,
      history: [copyBoard(board)],
      historyIndex: 0,
    };

    // Create a new game record
    const newGame = createNewGameRecord(newState);
    setCurrentGameId(newGame.id);
    setGameState(newState);
  }, [config]);

  const goBack = useCallback(() => {
    setGameState(prev => {
      if (prev.historyIndex === 0) return prev;

      const newIndex = prev.historyIndex - 1;
      const previousBoard = prev.history[newIndex];

      return {
        ...prev,
        stones: copyBoard(previousBoard),
        currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
        koPosition: null, // Reset ko position when navigating history
        historyIndex: newIndex,
      };
    });
  }, []);

  const goForward = useCallback(() => {
    setGameState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;

      const newIndex = prev.historyIndex + 1;
      const nextBoard = prev.history[newIndex];

      return {
        ...prev,
        stones: copyBoard(nextBoard),
        currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
        koPosition: null, // Reset ko position when navigating history
        historyIndex: newIndex,
      };
    });
  }, []);

  const jumpToStart = useCallback(() => {
    setGameState(prev => {
      if (prev.historyIndex === 0) return prev;

      const firstBoard = prev.history[0];

      return {
        ...prev,
        stones: copyBoard(firstBoard),
        currentPlayer: prev.handicapStones > 0 ? 'white' : 'black',
        koPosition: null,
        historyIndex: 0,
      };
    });
  }, []);

  const jumpToEnd = useCallback(() => {
    setGameState(prev => {
      const lastIndex = prev.history.length - 1;
      if (prev.historyIndex === lastIndex) return prev;

      const lastBoard = prev.history[lastIndex];

      // Calculate correct player based on number of moves
      const movesFromStart = lastIndex;
      const startPlayer = prev.handicapStones > 0 ? 'white' : 'black';
      const currentPlayer = movesFromStart % 2 === 0
        ? startPlayer
        : (startPlayer === 'black' ? 'white' : 'black');

      return {
        ...prev,
        stones: copyBoard(lastBoard),
        currentPlayer,
        koPosition: null,
        historyIndex: lastIndex,
      };
    });
  }, []);

  const goBack10 = useCallback(() => {
    setGameState(prev => {
      if (prev.historyIndex === 0) return prev;

      const newIndex = Math.max(0, prev.historyIndex - 10);
      const targetBoard = prev.history[newIndex];

      // Calculate correct player
      const movesBack = prev.historyIndex - newIndex;
      let currentPlayer = prev.currentPlayer;
      for (let i = 0; i < movesBack; i++) {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
      }

      return {
        ...prev,
        stones: copyBoard(targetBoard),
        currentPlayer,
        koPosition: null,
        historyIndex: newIndex,
      };
    });
  }, []);

  const goForward10 = useCallback(() => {
    setGameState(prev => {
      const maxIndex = prev.history.length - 1;
      if (prev.historyIndex === maxIndex) return prev;

      const newIndex = Math.min(maxIndex, prev.historyIndex + 10);
      const targetBoard = prev.history[newIndex];

      // Calculate correct player
      const movesForward = newIndex - prev.historyIndex;
      let currentPlayer = prev.currentPlayer;
      for (let i = 0; i < movesForward; i++) {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
      }

      return {
        ...prev,
        stones: copyBoard(targetBoard),
        currentPlayer,
        koPosition: null,
        historyIndex: newIndex,
      };
    });
  }, []);

  const loadGameById = useCallback((gameId: string) => {
    const savedGame = loadGame(gameId);
    if (savedGame) {
      setCurrentGameId(gameId);
      setGameState(savedGame.state);
    }
  }, []);

  return {
    gameState,
    currentGameId,
    placeStone,
    resetGame,
    loadGameById,
    goBack,
    goForward,
    jumpToStart,
    jumpToEnd,
    goBack10,
    goForward10,
  };
}
