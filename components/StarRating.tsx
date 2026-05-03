'use client';

import { useId } from 'react';

interface Props {
  value: number;
  max?: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 16, md: 20, lg: 26 };
const STAR_PATH = 'M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78z';

export default function StarRating({ value, max = 5, onChange, size = 'md' }: Props) {
  const uid = useId();
  const px = sizes[size];

  return (
    <span className="inline-flex gap-0.5 items-center">
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        const clipId = `${uid}-${i}`;
        return (
          <svg
            key={i}
            width={px} height={px} viewBox="0 0 20 20"
            onClick={() => onChange?.(i + 1)}
            className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            aria-label={onChange ? `${i + 1} star` : undefined}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={20 * fill} height="20" />
              </clipPath>
            </defs>
            <path d={STAR_PATH} fill="#e5e7eb" />
            <path d={STAR_PATH} fill="#facc15" clipPath={`url(#${clipId})`} />
          </svg>
        );
      })}
    </span>
  );
}
