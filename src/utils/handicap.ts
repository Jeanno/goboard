import { Position } from '../types';

export function getHandicapPositions(boardSize: number, handicap: number): Position[] {
  if (handicap === 0) return [];

  // Define star points for different board sizes
  let starPoints: { [key: number]: Position[] } = {};

  if (boardSize === 19) {
    // Standard 19x19 star points
    starPoints = {
      // Corner star points
      1: [{ row: 3, col: 15 }],
      2: [{ row: 3, col: 15 }, { row: 15, col: 3 }],
      3: [{ row: 3, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 15 }],
      4: [{ row: 3, col: 3 }, { row: 3, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 15 }],
      5: [{ row: 3, col: 3 }, { row: 3, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 15 }, { row: 9, col: 9 }],
      6: [{ row: 3, col: 3 }, { row: 3, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 15 }, { row: 9, col: 3 }, { row: 9, col: 15 }],
      7: [{ row: 3, col: 3 }, { row: 3, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 15 }, { row: 9, col: 3 }, { row: 9, col: 15 }, { row: 9, col: 9 }],
      8: [{ row: 3, col: 3 }, { row: 3, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 15 }, { row: 9, col: 3 }, { row: 9, col: 15 }, { row: 3, col: 9 }, { row: 15, col: 9 }],
      9: [{ row: 3, col: 3 }, { row: 3, col: 9 }, { row: 3, col: 15 }, { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 9, col: 15 }, { row: 15, col: 3 }, { row: 15, col: 9 }, { row: 15, col: 15 }],
    };
  } else if (boardSize === 13) {
    starPoints = {
      1: [{ row: 3, col: 9 }],
      2: [{ row: 3, col: 9 }, { row: 9, col: 3 }],
      3: [{ row: 3, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 9 }],
      4: [{ row: 3, col: 3 }, { row: 3, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 9 }],
      5: [{ row: 3, col: 3 }, { row: 3, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 6, col: 6 }],
      6: [{ row: 3, col: 3 }, { row: 3, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 6, col: 3 }, { row: 6, col: 9 }],
      7: [{ row: 3, col: 3 }, { row: 3, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 6, col: 3 }, { row: 6, col: 9 }, { row: 6, col: 6 }],
      8: [{ row: 3, col: 3 }, { row: 3, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 9 }, { row: 6, col: 3 }, { row: 6, col: 9 }, { row: 3, col: 6 }, { row: 9, col: 6 }],
      9: [{ row: 3, col: 3 }, { row: 3, col: 6 }, { row: 3, col: 9 }, { row: 6, col: 3 }, { row: 6, col: 6 }, { row: 6, col: 9 }, { row: 9, col: 3 }, { row: 9, col: 6 }, { row: 9, col: 9 }],
    };
  } else if (boardSize === 9) {
    starPoints = {
      1: [{ row: 2, col: 6 }],
      2: [{ row: 2, col: 6 }, { row: 6, col: 2 }],
      3: [{ row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 }],
      4: [{ row: 2, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 }],
      5: [{ row: 2, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 }, { row: 4, col: 4 }],
      6: [{ row: 2, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 }, { row: 4, col: 2 }, { row: 4, col: 6 }],
      7: [{ row: 2, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 }, { row: 4, col: 2 }, { row: 4, col: 6 }, { row: 4, col: 4 }],
      8: [{ row: 2, col: 2 }, { row: 2, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 6 }, { row: 4, col: 2 }, { row: 4, col: 6 }, { row: 2, col: 4 }, { row: 6, col: 4 }],
      9: [{ row: 2, col: 2 }, { row: 2, col: 4 }, { row: 2, col: 6 }, { row: 4, col: 2 }, { row: 4, col: 4 }, { row: 4, col: 6 }, { row: 6, col: 2 }, { row: 6, col: 4 }, { row: 6, col: 6 }],
    };
  }

  // Get positions for the requested handicap
  if (starPoints[handicap]) {
    return starPoints[handicap];
  }

  // If handicap is out of range, return empty
  return [];
}
