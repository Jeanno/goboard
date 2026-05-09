# Josekipedia Browser — Design

_Date: 2026-05-08_

## Goal

Add a browse-only joseki library to the goboard app. Users enter a "Joseki" mode, pick a starting pattern (e.g. 4-4 point), and walk a tree of canonical move sequences by clicking ghost-stone candidates on the board. Comments from the source dataset are shown for the current position.

## Non-goals (v1)

- Editing or annotating joseki in-app.
- Searching for joseki by board position from a live game.
- Deep-linking via URL.
- Capturing logic during joseki replay (datasets don't reach typical capture depths).
- Mobile-specific gestures beyond what the existing canvas already supports.

## Key decisions

- **Data source:** Kogo's Joseki Dictionary SGF, committed at `vendor/kogos-joseki.sgf`. Widely redistributed in OSS Go tools.
- **Build-time preprocessing:** SGF is converted to a flat JSON tree by `scripts/build-joseki.ts`, run manually via `npm run build:joseki`. Output `src/data/joseki.json` is committed. End-user `npm run build` is unaffected.
- **Integration:** Top-level mode toggle (`Play` | `Joseki`) in the App header. No router introduced.
- **Navigation:** Click-on-board on highlighted ghost candidates advances. Back button (and Left arrow) walks back. Reset returns to the root picker.
- **Display:** Full 19×19 board (matches dataset). Per-node info shown is just the dataset's comment text and a depth counter — no letters, names, or status tags per user preference.

## Architecture

```
src/
  components/
    GoBoard.tsx          (existing — refactored to use boardDraw helpers)
    JosekiBoard.tsx      (new — renders position + ghost candidates, emits clicks)
  hooks/
    useGoGame.ts         (existing)
    useJosekiBrowser.ts  (new — current node id, history stack, advance/back/reset)
  utils/
    boardDraw.ts         (new — drawGrid, drawStone, drawWoodTexture, getStarPoints)
    goRules.ts           (existing)
  data/
    joseki.json          (new — committed pre-built tree, gzip < 1 MB on wire)
  types/
    index.ts             (extended with JosekiNode, JosekiTree)
  App.tsx                (mode toggle: 'play' | 'joseki')

scripts/
  build-joseki.ts        (new — manual preprocessor)

vendor/
  kogos-joseki.sgf       (new — source dataset, checked in)
  README.md              (new — provenance note)
```

### Module boundaries

- `useJosekiBrowser` knows about the tree shape, nothing about canvas.
- `JosekiBoard` knows about canvas drawing and click → candidate-id, nothing about the tree.
- `boardDraw.ts` is the single owner of canvas drawing primitives. `GoBoard.tsx` is refactored to consume it (focused refactor scoped to this work).
- `joseki.json` is pure data. The build script is a developer tool, not part of `npm run build`.

## Data model

```ts
// src/types/index.ts (additions)

export interface JosekiNode {
  id: string;                    // 10-char sha1 of (parentId + serializedMove)
  move: { row: number; col: number; color: 'black' | 'white' } | null;
                                 // null only for root nodes
  children: string[];            // ordered ids of next-move nodes
  comment?: string;              // free-text from SGF C[...] property; omitted if empty
}

export interface JosekiTree {
  rootIds: string[];             // top-level entry points, e.g. one per starting pattern
  rootNames: Record<string, string>;  // id → display name for root picker
  nodes: Record<string, JosekiNode>;
  boardSize: 19;                 // fixed in v1
}
```

Rationale:
- Flat `nodes` map for O(1) lookup and easy serialization. Kogo's after dedup is in the tens of thousands of nodes.
- `move` carries color so the browser doesn't infer turn from history depth (datasets sometimes start with white-to-play variations).
- `children: string[]` (not embedded) means "go back" is a stack pop and shared subtrees aren't duplicated.

### Position rendering

`JosekiBoard` does not store a stone grid. Given the path from root to current node, it replays moves in order via `useMemo` to derive the displayed `StoneColor[][]`. No capture replay in v1; flagged for v1.1 if a node ends up looking wrong.

## UI / interaction

### Mode toggle

Segment control in the App header next to the title: `[ Play | Joseki ]`. State is `mode: 'play' | 'joseki'` in App. Existing play UI (burger, game info, controls, GoBoard) is wrapped in `mode === 'play'`. Joseki view replaces it when active.

### Joseki mode — two screens

**1. Root picker** (when no current root selected):
- Vertical list of root names, drawn from `JosekiTree.rootNames`.
- Click → enter browser at that root.

**2. Browser:**
- **Board:** full 19×19, rendered by `JosekiBoard`. Stones from replayed path. Wood texture and grid reused via `boardDraw.ts`.
- **Ghost candidates:** for each child of the current node, render a translucent stone (~40% opacity) of that child's `move.color` at its position. Hover → ~70% opacity, pointer cursor.
- **Click handling:** the canvas click handler snaps the cursor position to the nearest grid intersection (same logic as `GoBoard`). If that intersection has a ghost candidate, advance to that child id. Otherwise the click is ignored. No free placement in joseki mode.
- **Below the board:**
  - Move counter: `Move N` where N = depth from root.
  - Comment card: renders `currentNode.comment` as plain text. Card is hidden when comment is absent.
- **Controls:**
  - `◀ Back` — pops history stack to parent. Disabled at root.
  - `⏮ Reset` — clears history, returns to root picker.
- **Keyboard:** Left arrow = Back.

### Visual details

- Wood texture and stone rendering match `GoBoard` exactly via shared `boardDraw.ts`.
- Ghost color = color of the candidate move (so whose-turn-it-is is implicit).
- No letters/labels on candidates.
- Mobile scaling reuses the existing canvas-scaling pattern from `GoBoard`.

## Dataset pipeline

### `scripts/build-joseki.ts`

Run: `npm run build:joseki` (added to `package.json` scripts).

Steps:
1. Parse `vendor/kogos-joseki.sgf` with `@sabaki/sgf` (added to `devDependencies` only).
2. Walk the parsed tree. For each node:
   - `B[xy]` / `W[xy]` → `move` (SGF coords → 0-indexed row/col).
   - `C[...]` → `comment` (trimmed, omitted if empty).
   - `id = sha1(parentId + serializedMove).slice(0, 10)`. Stable across rebuilds; dedupes shared subtrees.
3. Identify roots: Kogo's organizes joseki under labeled section nodes. Extract these as `rootIds`; use the section's leading comment text as the display name in `rootNames`.
4. Filter:
   - Drop nodes with no move and no children (orphan section headers).
   - Drop pass moves (SGF `tt` or empty coordinate) and any subtrees they introduce — out of v1 scope.
5. Emit `src/data/joseki.json` matching `JosekiTree`.

### Size

Estimated ~3–4 MB raw JSON, well under 1 MB gzipped due to repetitive structure. If this becomes a problem post-implementation, shorten field names (`m`/`c`/`k`) as a v1.1 optimization. Not doing it speculatively.

### Risks and fallbacks

- Malformed SGF nodes: parser tolerates; we drop branches that don't yield a valid move and log the count.
- If `@sabaki/sgf` proves unsuitable, fallback is a hand-rolled parser (~200 lines); the SGF subset Kogo's uses is small.

## Testing

- Unit tests for `useJosekiBrowser`: advance, back-from-non-root, back-from-root no-op, reset.
- Unit tests for path-replay: given a path, the derived stone grid is correct.
- Build-script test: a tiny fixture SGF (3–4 nodes, one comment) produces the expected JSON.
- Manual: load app in dev, toggle to Joseki mode, walk a known sequence (e.g. 4-4 attach-and-extend) end-to-end, verify comments display.

## Out of scope (explicitly deferred)

- Joseki search from a game position.
- Joseki name/title and tag/status display (user opted these out for v1).
- Lettered candidate moves (A/B/C…).
- URL deep-linking.
- Capture replay during joseki playback.
- Editing/annotation.
- Multiple board sizes for joseki (fixed at 19×19).

## Open follow-ups (not blocking v1)

- Field-name shortening if JSON size is uncomfortable.
- Capture replay if a real-world joseki node displays incorrectly.
- v1.1 enhancement: "show all reachable terminal positions" overlay.
