import sgf from '@sabaki/sgf';
const { parseFile } = sgf as unknown as { parseFile: (path: string) => unknown };
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

interface JosekiNode {
  id: string;
  move: { row: number; col: number; color: 'black' | 'white' } | null;
  children: string[];
  comment?: string;
}

interface JosekiTree {
  rootIds: string[];
  rootNames: Record<string, string>;
  nodes: Record<string, JosekiNode>;
  boardSize: 19;
}

function sgfToCoord(sgf: string): { row: number; col: number } | null {
  if (sgf.length !== 2) return null;
  const col = sgf.charCodeAt(0) - 97;
  const row = sgf.charCodeAt(1) - 97;
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

let stats = {
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

  // Synthetic root — its children come from flattening Kogo's root chain.
  const root: JosekiNode = {
    id: ROOT_ID,
    move: null,
    children: [],
    comment: 'Click any highlighted point to start a joseki line.',
  };
  nodes[ROOT_ID] = root;

  // Gather candidate children from a SGF node, flattening transit nodes
  // (no-move section headers) so only move-bearing nodes become candidates.
  function gatherChildren(sgfNode: SgfNode, parentJosekiId: string): string[] {
    const out: string[] = [];
    for (const child of sgfNode.children) {
      stats.sgfNodesVisited++;
      // Skip pass moves entirely (and their subtrees)
      if (hasMoveProp(child) && isPassOrEmpty(child)) {
        stats.skippedPass++;
        continue;
      }
      // Skip AB/AW-only setup nodes (handicap setups in joseki context)
      if (
        !hasMoveProp(child) &&
        (child.data.AB !== undefined || child.data.AW !== undefined)
      ) {
        stats.skippedAB++;
        // Still flatten through to its children
        out.push(...gatherChildren(child, parentJosekiId));
        continue;
      }

      const move = extractMove(child);
      if (move) {
        const jn = buildNode(child, move, parentJosekiId);
        if (jn) out.push(jn.id);
      } else if (!hasMoveProp(child)) {
        // Transit / section node — flatten through
        out.push(...gatherChildren(child, parentJosekiId));
      } else {
        // Has B/W but coord didn't parse
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
    if (nodes[id]) {
      // Same path already produced this node — reuse (transposition under same parent).
      return nodes[id];
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

  // Validate board size if declared.
  const sz = sgfRoot.data.SZ?.[0];
  if (sz && sz !== '19' && sz !== '19:19') {
    throw new Error(`Unexpected SZ ${sz}; this script assumes 19x19.`);
  }

  const tree = buildTree(sgfRoot);

  writeFileSync(OUT_PATH, JSON.stringify(tree));
  const size = JSON.stringify(tree).length;
  console.log(`Wrote ${OUT_PATH} (${(size / 1024).toFixed(1)} KB)`);
  console.log('Stats:', stats);
  console.log(`Root has ${tree.nodes.root.children.length} starting candidates.`);
}

main();
