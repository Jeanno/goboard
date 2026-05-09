import { useRef, useEffect } from 'react';
import { BoardState, Position } from '../types';
import {
  canvasSize,
  clickToIntersection,
  drawGrid,
  drawStones,
  drawWoodTexture,
} from '../utils/boardDraw';
import './GoBoard.css';

interface GoBoardProps {
  gameState: BoardState;
  onPlaceStone: (pos: Position) => void;
}

export function GoBoard({ gameState, onPlaceStone }: GoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = canvasSize(gameState.boardSize);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWoodTexture(ctx, canvas.width, canvas.height, false);
    drawGrid(ctx, gameState.boardSize);
    drawStones(ctx, gameState.stones);
  }, [gameState.stones, gameState.boardSize]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = clickToIntersection(event, canvas, gameState.boardSize);
    if (pos) onPlaceStone(pos);
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={handleClick}
      className="go-board-canvas"
    />
  );
}
