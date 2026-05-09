import { lazy, Suspense } from 'react';

const JosekiView = lazy(() =>
  import('./JosekiView').then((m) => ({ default: m.JosekiViewWithData })),
);

export function JosekiViewLazy() {
  return (
    <Suspense fallback={<div className="joseki-loading">Loading joseki…</div>}>
      <JosekiView />
    </Suspense>
  );
}
