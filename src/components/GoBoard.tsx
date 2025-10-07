import { useRef, useEffect, useState } from 'react';
import { BoardState, Position } from '../types';
import './GoBoard.css';

interface GoBoardProps {
  gameState: BoardState;
  onPlaceStone: (pos: Position) => void;
}

export function GoBoard({ gameState, onPlaceStone }: GoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(40);
  const padding = 30;

  // Calculate canvas size
  const canvasSize = gameState.boardSize * cellSize + padding * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas background
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    ctx.fillStyle = isDark ? '#1a1a1a' : '#DCB35C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = isDark ? '#666' : '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < gameState.boardSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, padding + (gameState.boardSize - 1) * cellSize);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(padding + (gameState.boardSize - 1) * cellSize, padding + i * cellSize);
      ctx.stroke();
    }

    // Draw star points (for standard board sizes)
    const starPoints = getStarPoints(gameState.boardSize);
    ctx.fillStyle = isDark ? '#666' : '#000';
    starPoints.forEach(({ row, col }) => {
      ctx.beginPath();
      ctx.arc(
        padding + col * cellSize,
        padding + row * cellSize,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });

    // Draw stones
    gameState.stones.forEach((row, rowIndex) => {
      row.forEach((stone, colIndex) => {
        if (stone) {
          const x = padding + colIndex * cellSize;
          const y = padding + rowIndex * cellSize;
          const radius = cellSize * 0.45;

          // Draw stone shadow
          ctx.beginPath();
          ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fill();

          // Draw stone
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          if (stone === 'black') {
            ctx.fillStyle = '#000';
          } else {
            ctx.fillStyle = '#fff';
          }
          ctx.fill();

          // Add stone border
          ctx.strokeStyle = stone === 'black' ? '#333' : '#ddd';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    });
  }, [gameState.stones, gameState.boardSize, cellSize]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to board coordinates
    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    // Check if click is within bounds
    if (row >= 0 && row < gameState.boardSize && col >= 0 && col < gameState.boardSize) {
      onPlaceStone({ row, col });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      onClick={handleClick}
      className="go-board-canvas"
    />
  );
}

function getStarPoints(boardSize: number): Position[] {
  if (boardSize === 19) {
    return [
      { row: 3, col: 3 },
      { row: 3, col: 9 },
      { row: 3, col: 15 },
      { row: 9, col: 3 },
      { row: 9, col: 9 },
      { row: 9, col: 15 },
      { row: 15, col: 3 },
      { row: 15, col: 9 },
      { row: 15, col: 15 },
    ];
  } else if (boardSize === 13) {
    return [
      { row: 3, col: 3 },
      { row: 3, col: 9 },
      { row: 6, col: 6 },
      { row: 9, col: 3 },
      { row: 9, col: 9 },
    ];
  } else if (boardSize === 9) {
    return [
      { row: 2, col: 2 },
      { row: 2, col: 6 },
      { row: 4, col: 4 },
      { row: 6, col: 2 },
      { row: 6, col: 6 },
    ];
  }
  return [];
}
