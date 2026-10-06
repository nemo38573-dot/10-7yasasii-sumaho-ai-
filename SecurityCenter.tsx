import React, { useState } from 'react';

export function SecurityCenter() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [danger, setDanger] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    const t = text.trim();
    if (!t) return;
    setLoading(true);
    setResult('調べています…');
    setDanger(false);
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: t }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(data.message || 'うまく調べられませんでした。');
      } else {
        setResult(data.text || '');
        setDanger(/あぶない/.test((data.text || '').split('\n')[0]));
      }
    } catch {
      setResult('うまく調べられませんでした。もう一度お試しください。');
    }
    setLoading(false);
  };

  return (
    <section>
      <div className="ys-card ys-warn">
        <b style={{ color: 'var(--warn)' }}>まず覚えておくこと</b>
        <div className="whitespace-pre-wrap mt-1">
          ・「お金を払って」「今すぐ」と急がせる連絡は、あやしい{'\n'}
          ・暗証番号やパスワードは、だれにも教えない{'\n'}
          ・知らないリンクは、押さない{'\n'}
          ・迷ったら、家族か、消費者ホットライン「188」に電話
        </div>
      </div>

      <h2 className="text-lg mt-5 mb-2">届いたメッセージを調べる</h2>
      <p className="text-sm" style={{ color: 'var(--sub)' }}>メールやSMSの文章を、ここに貼りつけてください。</p>
      <textarea
        className="w-full rounded-2xl p-3 min-h-[110px]"
        style={{ background: 'var(--card)', border: '2px solid var(--line)', color: 'var(--ink)' }}
        placeholder="ここに文章を貼りつけ"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2">
        <button
          className="ys-btn font-bold"
          style={{ background: 'var(--main)', color: 'var(--on-main)', borderColor: 'var(--main)' }}
          disabled={loading}
          onClick={check}
        >
          あやしいか調べる
        </button>
      </div>
      {result && (
        <div className={`ys-card mt-2.5 ${danger ? 'ys-warn' : ''}`}>
          <div className="whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </section>
  );
}
