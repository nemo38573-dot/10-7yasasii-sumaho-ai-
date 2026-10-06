import React from 'react';

// よく出てくる操作対象を、ことばだけでなく簡易アイコンでも示す
const ICONS: { test: RegExp; render: (key: string) => React.ReactNode }[] = [
  { test: /歯車|設定/, render: (k) => (
    <g key={k}>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#8A8F98" strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="10.7" y="1.5" width="2.6" height="4.2" rx="1" fill="#8A8F98" transform={`rotate(${a} 12 12)`} />
      ))}
    </g>
  ) },
  { test: /wi-?fi|ワイファイ|ワイハイ/i, render: (k) => (
    <g key={k} stroke="#2E90D6" strokeWidth="2.2" fill="none" strokeLinecap="round">
      <path d="M4 9.5a11.5 11.5 0 0 1 16 0" />
      <path d="M7 13a7 7 0 0 1 10 0" />
      <path d="M10 16.5a2.8 2.8 0 0 1 4 0" />
      <circle cx="12" cy="20" r="1.4" fill="#2E90D6" stroke="none" />
    </g>
  ) },
  { test: /電池|バッテリー|充電/, render: (k) => (
    <g key={k}>
      <rect x="2" y="7" width="17" height="10" rx="2" fill="none" stroke="#3AA76D" strokeWidth="2" />
      <rect x="20" y="10" width="2.4" height="4" rx="1" fill="#3AA76D" />
      <rect x="4.5" y="9.5" width="9" height="5" fill="#3AA76D" />
    </g>
  ) },
  { test: /戻る|もどる/, render: (k) => (
    <g key={k} stroke="#5B6470" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5 7 12l8 7" />
    </g>
  ) },
  { test: /ホーム画面|ホームボタン/, render: (k) => (
    <g key={k} stroke="#5B6470" strokeWidth="2.2" fill="none" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </g>
  ) },
  { test: /カメラ/, render: (k) => (
    <g key={k} stroke="#5B6470" strokeWidth="2" fill="none" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8.5 7 10 4h4l1.5 3" />
      <circle cx="12" cy="13.5" r="3.6" />
    </g>
  ) },
  { test: /写真|アルバム|ギャラリー/, render: (k) => (
    <g key={k} stroke="#C77E3B" strokeWidth="2" fill="none" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.8" fill="#C77E3B" stroke="none" />
      <path d="M4 17.5 9 12l3.5 3.5L16 12l4 5" />
    </g>
  ) },
  { test: /LINE|メッセージ|ふきだし|トーク/i, render: (k) => (
    <g key={k}>
      <path d="M3 5h18v12H9l-4 4v-4H3z" fill="none" stroke="#2FAB57" strokeWidth="2" strokeLinejoin="round" />
    </g>
  ) },
  { test: /ゴミ箱|削除|消したい/, render: (k) => (
    <g key={k} stroke="#B4331F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
    </g>
  ) },
  { test: /鍵|ロック|パスワード|暗証/, render: (k) => (
    <g key={k} stroke="#8A5AC7" strokeWidth="2" fill="none" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </g>
  ) },
  { test: /虫眼鏡|検索|探す/, render: (k) => (
    <g key={k} stroke="#5B6470" strokeWidth="2.2" fill="none" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </g>
  ) },
  { test: /電話|コール/, render: (k) => (
    <g key={k} stroke="#3AA76D" strokeWidth="2" fill="none" strokeLinejoin="round">
      <path d="M5 4c1.5 0 2.7.3 3.2 1.4l.9 2c.3.7.1 1.5-.4 2l-1 .9c.8 2 2.4 3.6 4.4 4.4l.9-1c.5-.5 1.3-.7 2-.4l2 .9c1.1.5 1.4 1.7 1.4 3.2 0 1.4-1.1 2.6-2.6 2.4C10.5 19.1 4.9 13.5 4.1 8.6 3.9 7.1 3.6 6 5 4z" />
    </g>
  ) },
];

function iconFor(text: string): React.ReactNode | null {
  const hit = ICONS.find((i) => i.test.test(text));
  return hit ? hit.render(text) : null;
}

export function StepVisual({ text }: { text: string }) {
  const match = text.match(/【次の操作】([\s\S]*?)(【|$)/);
  if (!match) return null;
  const items = match[1]
    .split(/\n|・/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (items.length < 2) return null;

  const rowH = 60;
  const height = items.length * rowH + 10;

  return (
    <svg viewBox={`0 0 340 ${height}`} className="w-full mt-2.5">
      {items.map((item, i) => {
        const y = 32 + i * rowH;
        const icon = iconFor(item);
        return (
          <g key={i}>
            <circle cx="24" cy={y} r="16" fill="var(--main)" />
            <text x="24" y={y + 6} textAnchor="middle" fill="var(--on-main)" fontSize="16" fontWeight="700">
              {i + 1}
            </text>
            {i < items.length - 1 && (
              <line x1="24" y1={y + 16} x2="24" y2={y + rowH - 12} stroke="var(--line)" strokeWidth="3" />
            )}
            {icon && (
              <g transform={`translate(50, ${y - 12})`}>
                <rect x="-4" y="-4" width="32" height="32" rx="8" fill="var(--card)" stroke="var(--line)" strokeWidth="1.5" />
                <g transform="translate(0,0)">{icon}</g>
              </g>
            )}
            <foreignObject x={icon ? 92 : 50} y={y - 22} width={icon ? 240 : 280} height="56">
              <div style={{ fontSize: 15, lineHeight: 1.4, color: 'var(--ink)' }}>{item}</div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
