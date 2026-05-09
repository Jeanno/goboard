import { useCallback, useMemo, useState } from 'react';
import type {
  JosekiNode,
  JosekiTree,
  PlayerColor,
  Position,
  StoneColor,
} from '../types';
import { applyMoveToBoard, createEmptyBoard, isValidMove } from '../utils/goRules';

export interface FreeMove {
  row: number;
  col: number;
  color: PlayerColor;
}

export interface JosekiBrowserState {
  candidates: JosekiNode[];
  stones: StoneColor[][];
  lastMove: Position | null;
  captured: { black: number; white: number };
  comment: string | null;
  depth: number;
  isOffTree: boolean;
  isAtStart: boolean;
  advance: (childId: string) => void;
  placeFree: (row: number, col: number) => void;
  goBack: () => void;
  reset: () => void;
}

interface ReplayResult {
  stones: StoneColor[][];
  lastMove: Position | null;
  lastColor: PlayerColor | null;
  ko: Position | null;
  captured: { black: number; white: number };
}

function replay(
  tree: JosekiTree,
  path: string[],
  freeplay: FreeMove[],
): ReplayResult {
  const board = createEmptyBoard(tree.boardSize);
  const captured = { black: 0, white: 0 };
  let ko: Position | null = null;
  let lastMove: Position | null = null;
  let lastColor: PlayerColor | null = null;

  function step(move: { row: number; col: number; color: PlayerColor }) {
    const opp: PlayerColor = move.color === 'black' ? 'white' : 'black';
    const result = applyMoveToBoard(board, move, tree.boardSize);
    captured[opp] += result.capturedCount;
    ko = result.ko;
    lastMove = { row: move.row, col: move.col };
    lastColor = move.color;
  }

  for (const id of path) {
    const node = tree.nodes[id];
    if (node?.move) step(node.move);
  }
  for (const m of freeplay) step(m);

  return { stones: board, lastMove, lastColor, ko, captured };
}

export function useJosekiBrowser(tree: JosekiTree): JosekiBrowserState {
  const initialRoot = tree.rootIds[0] ?? null;
  const [path, setPath] = useState<string[]>(initialRoot ? [initialRoot] : []);
  const [freeplay, setFreeplay] = useState<FreeMove[]>([]);

  const isOffTree = freeplay.length > 0;
  const currentNode: JosekiNode | null =
    path.length === 0 ? null : tree.nodes[path[path.length - 1]] ?? null;

  const candidates = useMemo<JosekiNode[]>(() => {
    if (isOffTree || !currentNode) return [];
    return currentNode.children
      .map((id) => tree.nodes[id])
      .filter((n): n is JosekiNode => Boolean(n && n.move));
  }, [tree, currentNode, isOffTree]);

  const { stones, lastMove, lastColor, ko, captured } = useMemo(
    () => replay(tree, path, freeplay),
    [tree, path, freeplay],
  );

  const nextColor: PlayerColor = lastColor === 'black' ? 'white' : 'black';

  const advance = useCallback((childId: string) => {
    setPath((prev) => [...prev, childId]);
  }, []);

  const placeFree = useCallback(
    (row: number, col: number) => {
      const validation = isValidMove(stones, { row, col }, nextColor, ko, tree.boardSize);
      if (!validation.valid) return;
      setFreeplay((prev) => [...prev, { row, col, color: nextColor }]);
    },
    [stones, nextColor, ko, tree.boardSize],
  );

  const goBack = useCallback(() => {
    if (freeplay.length > 0) {
      setFreeplay((prev) => prev.slice(0, -1));
    } else {
      setPath((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }
  }, [freeplay.length]);

  const reset = useCallback(() => {
    setPath(initialRoot ? [initialRoot] : []);
    setFreeplay([]);
  }, [initialRoot]);

  const isAtStart = path.length <= 1 && freeplay.length === 0;

  return {
    candidates,
    stones,
    lastMove,
    captured,
    comment: currentNode?.comment ?? null,
    depth: Math.max(0, path.length - 1) + freeplay.length,
    isOffTree,
    isAtStart,
    advance,
    placeFree,
    goBack,
    reset,
  };
}
