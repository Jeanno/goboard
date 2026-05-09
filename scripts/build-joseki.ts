import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sgf from '@sabaki/sgf';
import type { JosekiNode, JosekiTree } from '../src/types';

const { parseFile } = sgf as unknown as { parseFile: (path: string) => unknown };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SGF_PATH = resolve(ROOT, 'vendor/kogos-joseki.sgf');
const OUT_PATH = resolve(ROOT, 'src/data/joseki.json');
const BOARD_SIZE = 19;

interface SgfNode {
  id: number;
  data: Record<string, string[]>;
  children: SgfNode[];
}

function sgfToCoord(coord: string): { row: number; col: number } | null {
  if (coord.length !== 2) return null;
  const col = coord.charCodeAt(0) - 97;
  const row = coord.charCodeAt(1) - 97;
  if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return null;
  return { row, col };
}

function extractMove(node: SgfNode): JosekiNode['move'] {
  const b = node.data.B?.[0];
  const w = node.data.W?.[0];
  if (b !== undefined) {
    const coord = sgfToCoord(b);
    return coord ? { ...coord, color: 'black' } : null;
  }
  if (w !== undefined) {
    const coord = sgfToCoord(w);
    return coord ? { ...coord, color: 'white' } : null;
  }
  return null;
}

function extractComment(node: SgfNode): string | undefined {
  const c = node.data.C?.[0];
  if (!c) return undefined;
  const trimmed = c.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hashId(parentId: string, move: JosekiNode['move']): string {
  const key = move ? `${parentId}:${move.color[0]}${move.row},${move.col}` : `${parentId}:root`;
  return createHash('sha1').update(key).digest('hex').slice(0, 12);
}

const stats = {
  sgfNodesVisited: 0,
  emitted: 0,
  skippedInvalidMove: 0,
  skippedPass: 0,
  skippedAB: 0,
};

function isPassOrEmpty(node: SgfNode): boolean {
  const b = node.data.B?.[0];
  const w = node.data.W?.[0];
  if (b !== undefined && (b === '' || b === 'tt')) return true;
  if (w !== undefined && (w === '' || w === 'tt')) return true;
  return false;
}

function hasMoveProp(node: SgfNode): boolean {
  return node.data.B !== undefined || node.data.W !== undefined;
}

function buildTree(sgfRoot: SgfNode): JosekiTree {
  const nodes: Record<string, JosekiNode> = {};
  const ROOT_ID = 'root';

  const root: JosekiNode = {
    id: ROOT_ID,
    move: null,
    children: [],
    comment: 'Click any highlighted point to start a joseki line.',
  };
  nodes[ROOT_ID] = root;

  function gatherChildren(sgfNode: SgfNode, parentJosekiId: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const push = (id: string) => {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    };

    for (const child of sgfNode.children) {
      stats.sgfNodesVisited++;
      if (hasMoveProp(child) && isPassOrEmpty(child)) {
        stats.skippedPass++;
        continue;
      }
      if (
        !hasMoveProp(child) &&
        (child.data.AB !== undefined || child.data.AW !== undefined)
      ) {
        stats.skippedAB++;
        for (const id of gatherChildren(child, parentJosekiId)) push(id);
        continue;
      }

      const move = extractMove(child);
      if (move) {
        const jn = buildNode(child, move, parentJosekiId);
        if (jn) push(jn.id);
      } else if (!hasMoveProp(child)) {
        for (const id of gatherChildren(child, parentJosekiId)) push(id);
      } else {
        stats.skippedInvalidMove++;
      }
    }
    return out;
  }

  function buildNode(
    sgfNode: SgfNode,
    move: NonNullable<JosekiNode['move']>,
    parentJosekiId: string,
  ): JosekiNode | null {
    const id = hashId(parentJosekiId, move);
    const existing = nodes[id];
    if (existing) {
      // Transposition: same parent + same move reached via a different SGF
      // subtree. Merge any new children we find under this revisit.
      for (const cid of gatherChildren(sgfNode, id)) {
        if (!existing.children.includes(cid)) existing.children.push(cid);
      }
      if (!existing.comment) existing.comment = extractComment(sgfNode);
      return existing;
    }
    const node: JosekiNode = {
      id,
      move,
      children: [],
      comment: extractComment(sgfNode),
    };
    nodes[id] = node;
    stats.emitted++;
    node.children = gatherChildren(sgfNode, id);
    return node;
  }

  root.children = gatherChildren(sgfRoot, ROOT_ID);

  return {
    rootIds: [ROOT_ID],
    rootNames: { [ROOT_ID]: 'Joseki' },
    nodes,
    boardSize: 19,
  };
}

function main() {
  console.log(`Reading ${SGF_PATH}`);
  const collection = parseFile(SGF_PATH) as unknown as SgfNode[];
  if (!collection.length) {
    throw new Error('SGF parsed to empty collection');
  }
  if (collection.length > 1) {
    console.warn(`Multiple SGF roots (${collection.length}); using only the first.`);
  }
  const sgfRoot = collection[0];

  const sz = sgfRoot.data.SZ?.[0];
  if (sz && sz !== '19' && sz !== '19:19') {
    throw new Error(`Unexpected SZ ${sz}; this script assumes 19x19.`);
  }

  const tree = buildTree(sgfRoot);
  const serialized = JSON.stringify(tree);
  writeFileSync(OUT_PATH, serialized);
  console.log(`Wrote ${OUT_PATH} (${(serialized.length / 1024).toFixed(1)} KB)`);
  console.log('Stats:', stats);
  console.log(`Root has ${tree.nodes.root.children.length} starting candidates.`);
}

main();
