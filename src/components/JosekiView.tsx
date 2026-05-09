import { useEffect } from 'react';
import { useJosekiBrowser } from '../hooks/useJosekiBrowser';
import type { JosekiTree } from '../types';
import { JosekiBoard } from './JosekiBoard';
import josekiData from '../data/joseki.json';
import './JosekiView.css';

export function JosekiViewWithData() {
  return <JosekiView tree={josekiData as unknown as JosekiTree} />;
}

interface JosekiViewProps {
  tree: JosekiTree;
}

export function JosekiView({ tree }: JosekiViewProps) {
  const browser = useJosekiBrowser(tree);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') browser.goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [browser]);

  const isAtStart = browser.path.length <= 1 && browser.freeplay.length === 0;

  return (
    <div className="joseki-view">
      <div className="joseki-board-col">
        <JosekiBoard
          boardSize={tree.boardSize}
          stones={browser.stones}
          candidates={browser.candidates}
          lastMove={browser.lastMove}
          onAdvance={browser.advance}
          onFreePlay={browser.placeFree}
        />
      </div>

      <aside className="joseki-sidebar">
        <div className="joseki-meta">
          <div className="joseki-depth">Move {browser.depth}</div>
          {browser.isOffTree && (
            <span className="joseki-badge">Off tree · free play</span>
          )}
          {(browser.captured.black > 0 || browser.captured.white > 0) && (
            <span className="joseki-captures">
              Captured · B {browser.captured.black} / W {browser.captured.white}
            </span>
          )}
        </div>

        {browser.isOffTree ? (
          <div className="joseki-comment muted">
            You're exploring outside the joseki tree. Click anywhere to keep
            playing; ◀ Back unwinds your moves and returns to the tree.
          </div>
        ) : browser.currentNode?.comment ? (
          <div className="joseki-comment">{browser.currentNode.comment}</div>
        ) : (
          <div className="joseki-comment muted">
            Click a numbered marker to follow a joseki line, or click anywhere
            else on the board to explore freely.
          </div>
        )}

        {!browser.isOffTree && browser.candidates.length === 0 && !isAtStart && (
          <div className="joseki-leaf-note">End of this line in the dictionary.</div>
        )}

        <div className="joseki-controls">
          <button
            onClick={browser.goBack}
            disabled={isAtStart}
            title="Back (←)"
          >
            ◀ Back
          </button>
          <button onClick={browser.reset} disabled={isAtStart} title="Reset to start">
            ⏮ Reset
          </button>
        </div>
      </aside>
    </div>
  );
}
