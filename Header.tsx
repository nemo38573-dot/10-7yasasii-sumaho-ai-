import React from 'react';
import { FontSize } from '../types';

const SIZES: { key: FontSize; label: string; px: string }[] = [
  { key: 'normal', label: 'ふつう', px: '22px' },
  { key: 'large', label: '大きい', px: '27px' },
  { key: 'xlarge', label: 'とても大きい', px: '32px' },
];

export function Header({ fontSize, onCycleFontSize }: { fontSize: FontSize; onCycleFontSize: () => void }) {
  const current = SIZES.find((s) => s.key === fontSize) ?? SIZES[0];
  return (
    <header className="flex items-center justify-between gap-2 mb-3">
      <h1 className="text-xl font-bold m-0">ＡＩスマホ先生</h1>
      <button
        className="ys-btn text-sm py-1 px-3"
        style={{ minHeight: 44 }}
        aria-label="文字の大きさを変える"
        onClick={onCycleFontSize}
      >
        文字：{current.label}
      </button>
    </header>
  );
}

export { SIZES };
