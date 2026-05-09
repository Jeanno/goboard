import { useEffect, useRef, useState } from 'react';
import type { JosekiNode, StoneColor } from '../types';
import {
  canvasSize,
  clickToIntersection,
  drawCandidateMarker,
  drawCoordinateLabels,
  drawGrid,
  drawLastMoveMarker,
  drawStones,
  drawWoodTexture,
} from '../utils/boardDraw';
import './GoBoard.css';

interface JosekiBoardProps {
  boardSize: number;
  stones: StoneColor[][];
  candidates: JosekiNode[];
  lastMove: { row: number; col: number } | null;
  onAdvance: (childId: string) => void;
  onFreePlay: (row: number, col: number) => void;
}

export function JosekiBoard({
  boardSize,
  stones,
  candidates,
  lastMove,
  onAdvance,
  onFreePlay,
}: JosekiBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = canvasSize(boardSize);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWoodTexture(ctx, canvas.width, canvas.height, false);
    drawGrid(ctx, boardSize);
    drawCoordinateLabels(ctx, boardSize);
    drawStones(ctx, stones);

    if (lastMove) drawLastMoveMarker(ctx, lastMove.row, lastMove.col);

    candidates.forEach((node, i) => {
      if (!node.move) return;
      const kind =
        node.children.length === 0
          ? 'leaf'
          : node.comment
            ? 'annotated'
            : 'branch';
      drawCandidateMarker(ctx, node.move.row, node.move.col, i + 1, kind, i === hoverIdx);
    });
  }, [stones, candidates, lastMove, boardSize, hoverIdx]);

  const findCandidateIdx = (event: React.MouseEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const pos = clickToIntersection(event, canvas, boardSize);
    if (!pos) return null;
    const idx = candidates.findIndex(
      (c) => c.move && c.move.row === pos.row && c.move.col === pos.col,
    );
    return idx >= 0 ? idx : null;
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const idx = findCandidateIdx(event);
    if (idx !== null) {
      const node = candidates[idx];
      if (node) onAdvance(node.id);
      return;
    }
    const pos = clickToIntersection(event, canvas, boardSize);
    if (!pos) return;
    if (stones[pos.row][pos.col] !== null) return;
    onFreePlay(pos.row, pos.col);
  };

  const handleMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverIdx(findCandidateIdx(event));
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
      className="go-board-canvas"
    />
  );
}
