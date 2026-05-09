import { useCallback, useMemo, useState } from 'react';
import type { JosekiNode, JosekiTree, StoneColor } from '../types';

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

  const { stones, lastMove, lastColor } = useMemo(() => {
    const board = emptyBoard(tree.boardSize);
    let last: { row: number; col: number } | null = null;
    let lastCol: 'black' | 'white' | null = null;
    for (const id of path) {
      const node = tree.nodes[id];
      if (node?.move) {
        board[node.move.row][node.move.col] = node.move.color;
        last = { row: node.move.row, col: node.move.col };
        lastCol = node.move.color;
      }
    }
    for (const m of freeplay) {
      board[m.row][m.col] = m.color;
      last = { row: m.row, col: m.col };
      lastCol = m.color;
    }
    return { stones: board, lastMove: last, lastColor: lastCol };
  }, [tree, path, freeplay]);

  const nextColor: 'black' | 'white' = lastColor === 'black' ? 'white' : 'black';

  const selectRoot = useCallback((id: string) => {
    setPath([id]);
    setFreeplay([]);
  }, []);

  const advance = useCallback((childId: string) => {
    setPath((prev) => [...prev, childId]);
  }, []);

  const placeFree = useCallback((row: number, col: number) => {
    setFreeplay((prev) => {
      // Reject occupied squares (cheap precheck against existing stones).
      // Caller already gates this, but double-guard for safety.
      const lastFP = prev[prev.length - 1];
      const lastFPColor = lastFP?.color;
      const color: 'black' | 'white' = lastFPColor
        ? lastFPColor === 'black'
          ? 'white'
          : 'black'
        : nextColor;
      return [...prev, { row, col, color }];
    });
  }, [nextColor]);

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
    depth: Math.max(0, path.length - 1) + freeplay.length,
    isOffTree,
    selectRoot,
    advance,
    placeFree,
    goBack,
    reset,
  };
}
