'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  chainName: string;
  before: number;
  after: number;
  onClose: () => void;
}

export default function RatingUpdatedBanner({ chainName, before, after, onClose }: Props) {
  const [displayed, setDisplayed] = useState(before);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(before + (after - before) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [before, after]);

  const increased = after > before;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm animate-trigger-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${increased ? 'text-emerald-500' : 'text-red-400'}`}>
            {increased ? '▲' : '▼'}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {chainName} rating updated
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
              <span>{before.toFixed(2)}</span>
              <span>→</span>
              <span className={`font-bold ${increased ? 'text-emerald-600' : 'text-red-500'}`}>
                {displayed.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0">
          ✕
        </button>
      </div>
    </div>
  );
}
