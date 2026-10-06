import React from 'react';
import { LogEntry } from '../types';

export function LogPanel({ logs, onOpen, onClear }: { logs: LogEntry[]; onOpen: (log: LogEntry) => void; onClear: () => void }) {
  return (
    <section>
      <h2 className="text-lg mt-1 mb-2">これまでの相談</h2>
      <p className="text-sm mb-3" style={{ color: 'var(--sub)' }}>この端末に保存されています。押すと続きを見られます。</p>
      {logs.length === 0 && <p className="text-sm" style={{ color: 'var(--sub)' }}>まだ相談の記録がありません。</p>}
      {logs.slice().reverse().map((log) => (
        <button key={log.id} className="ys-btn block w-full text-left mb-2" onClick={() => onOpen(log)}>
          <div className="font-bold">{log.title}</div>
          <div className="text-sm" style={{ color: 'var(--sub)' }}>{log.date}</div>
        </button>
      ))}
      {logs.length > 0 && (
        <div className="mt-2">
          <button
            className="ys-btn"
            onClick={() => {
              if (window.confirm('ログを全部消してよいですか？')) onClear();
            }}
          >
            ログを全部消す
          </button>
        </div>
      )}
    </section>
  );
}
