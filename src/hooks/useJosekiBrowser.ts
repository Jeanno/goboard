import { useCallback, useMemo, useState } from 'react';
import type { JosekiNode, JosekiTree, Position, StoneColor } from '../types';
import { getCapturedGroups, isValidMove } from '../utils/goRules';

export interface FreeMove {
  row: number;
  col: number;
  color: 'black' | 'white';
}

export interface JosekiBrowserState {
  tree: JosekiTree;
  rootId: string | null;
  path: string[];
  freeplay: FreeMove[];
  currentNode: JosekiNode | null;
  candidates: JosekiNode[];
  stones: StoneColor[][];
  lastMove: { row: number; col: number } | null;
  nextColor: 'black' | 'white';
  captured: { black: number; white: number };
  depth: number;
  isOffTree: boolean;
  selectRoot: (rootId: string) => void;
  advance: (childId: string) => void;
  placeFree: (row: number, col: number) => void;
  goBack: () => void;
  reset: () => void;
}

function emptyBoard(boardSize: number): StoneColor[][] {
  return Array.from({ length: boardSize }, () =>
    Array.from({ length: boardSize }, () => null),
  );
}

interface ReplayResult {
  stones: StoneColor[][];
  lastMove: Position | null;
  lastColor: 'black' | 'white' | null;
  ko: Position | null;
  captured: { black: number; white: number };
}

function replay(
  tree: JosekiTree,
  path: string[],
  freeplay: FreeMove[],
): ReplayResult {
  const board = emptyBoard(tree.boardSize);
  const captured = { black: 0, white: 0 };
  let ko: Position | null = null;
  let lastMove: Position | null = null;
  let lastColor: 'black' | 'white' | null = null;

  function applyMove(move: { row: number; col: number; color: 'black' | 'white' }) {
    board[move.row][move.col] = move.color;
    lastMove = { row: move.row, col: move.col };
    lastColor = move.color;

    const opp: 'black' | 'white' = move.color === 'black' ? 'white' : 'black';
    const groups = getCapturedGroups(board, opp, tree.boardSize);
    let totalCaptured = 0;
    for (const g of groups) {
      totalCaptured += g.length;
      for (const p of g) board[p.row][p.col] = null;
    }
    captured[opp] += totalCaptured;

    ko = totalCaptured === 1 && groups.length === 1 ? groups[0][0] : null;
  }

  for (const id of path) {
    const node = tree.nodes[id];
    if (node?.move) applyMove(node.move);
  }
  for (const m of freeplay) applyMove(m);

  return { stones: board, lastMove, lastColor, ko, captured };
}

export function useJosekiBrowser(tree: JosekiTree): JosekiBrowserState {
  const initialRoot = tree.rootIds[0] ?? null;
  const [path, setPath] = useState<string[]>(initialRoot ? [initialRoot] : []);
  const [freeplay, setFreeplay] = useState<FreeMove[]>([]);

  const rootId = path[0] ?? null;

  const currentNode = useMemo<JosekiNode | null>(() => {
    if (path.length === 0) return null;
    return tree.nodes[path[path.length - 1]] ?? null;
  }, [tree, path]);

  const isOffTree = freeplay.length > 0;

  const candidates = useMemo<JosekiNode[]>(() => {
    if (isOffTree || !currentNode) return [];
    return currentNode.children
      .map((id) => tree.nodes[id])
      .filter((n): n is JosekiNode => Boolean(n && n.move));
  }, [tree, currentNode, isOffTree]);

  const replayResult = useMemo(
    () => replay(tree, path, freeplay),
    [tree, path, freeplay],
  );
  const { stones, lastMove, lastColor, ko, captured } = replayResult;

  const nextColor: 'black' | 'white' = lastColor === 'black' ? 'white' : 'black';

  const selectRoot = useCallback((id: string) => {
    setPath([id]);
    setFreeplay([]);
  }, []);

  const advance = useCallback((childId: string) => {
    setPath((prev) => [...prev, childId]);
  }, []);

  const placeFree = useCallback(
    (row: number, col: number) => {
      const validation = isValidMove(stones, { row, col }, nextColor, ko, tree.boardSize);
      if (!validation.valid) {
        console.log('Joseki free-play rejected:', validation.reason);
        return;
      }
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

  return {
    tree,
    rootId,
    path,
    freeplay,
    currentNode,
    candidates,
    stones,
    lastMove,
    nextColor,
    captured,
    depth: Math.max(0, path.length - 1) + freeplay.length,
    isOffTree,
    selectRoot,
    advance,
    placeFree,
    goBack,
    reset,
  };
}
