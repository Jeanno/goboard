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

const HINT_OFFTREE =
  "You're exploring outside the joseki tree. Click anywhere to keep playing; ◀ Back unwinds your moves and returns to the tree.";
const HINT_NOCOMMENT =
  'Click a numbered marker to follow a joseki line, or click anywhere else on the board to explore freely.';

export function JosekiView({ tree }: JosekiViewProps) {
  const browser = useJosekiBrowser(tree);
  const { goBack, isAtStart, isOffTree, comment, candidates, captured, depth } = browser;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack]);

  let commentText: string;
  let isHint = false;
  if (isOffTree) {
    commentText = HINT_OFFTREE;
    isHint = true;
  } else if (comment) {
    commentText = comment;
  } else {
    commentText = HINT_NOCOMMENT;
    isHint = true;
  }

  const showLeafNote = !isOffTree && candidates.length === 0 && !isAtStart;

  return (
    <div className="joseki-view">
      <div className="joseki-board-col">
        <JosekiBoard
          boardSize={tree.boardSize}
          stones={browser.stones}
          candidates={candidates}
          lastMove={browser.lastMove}
          onAdvance={browser.advance}
          onFreePlay={browser.placeFree}
        />
      </div>

      <aside className="joseki-sidebar">
        <div className="joseki-meta">
          <div className="joseki-depth">Move {depth}</div>
          {isOffTree && <span className="joseki-badge">Off tree · free play</span>}
          {(captured.black > 0 || captured.white > 0) && (
            <span className="joseki-captures">
              Captured · B {captured.black} / W {captured.white}
            </span>
          )}
        </div>

        <div className={`joseki-comment${isHint ? ' muted' : ''}`}>{commentText}</div>

        {showLeafNote && (
          <div className="joseki-leaf-note">End of this line in the dictionary.</div>
        )}

        <div className="joseki-controls">
          <button onClick={goBack} disabled={isAtStart} title="Back (←)">
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
