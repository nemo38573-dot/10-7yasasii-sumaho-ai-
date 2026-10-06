import React from 'react';

const TEMPLATES = [
  '文字を大きくしたい', '音が出ない', 'LINEで写真を送りたい', '電池がすぐなくなる',
  'あやしいメールが来た', 'Wi-Fiにつながらない', '容量がいっぱいと出る', 'アプリを消したい',
];

export function TemplateGrid({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div>
      <p>こまっていることを、ひとつ押してください。</p>
      <div className="grid grid-cols-2 gap-2.5">
        {TEMPLATES.map((t) => (
          <button key={t} className="ys-btn text-left font-bold" onClick={() => onPick(t + '。')}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
