import React, { useState } from 'react';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { SecurityCenter } from './components/SecurityCenter';
import { LogPanel } from './components/LogPanel';
import { ChatTurn, FontSize, LogEntry, Message } from './types';

const FONT_PX: Record<FontSize, string> = { normal: '22px', large: '27px', xlarge: '32px' };
const CYCLE: FontSize[] = ['normal', 'large', 'xlarge'];

function loadLogs(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem('yasu_logs') || '[]');
  } catch {
    return [];
  }
}
function saveLogs(logs: LogEntry[]) {
  try {
    localStorage.setItem('yasu_logs', JSON.stringify(logs.slice(-30)));
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [tab, setTab] = useState<'chat' | 'security' | 'logs'>('chat');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(loadLogs);

  const cycleFont = () => setFontSize((f) => CYCLE[(CYCLE.indexOf(f) + 1) % CYCLE.length]);

  const persistLog = (msgs: Message[], hist: ChatTurn[]) => {
    if (msgs.length === 0) return;
    const firstUser = msgs.find((m) => m.sender === 'user');
    const title = (firstUser?.text || '相談').slice(0, 20);
    const next = [...logs, { id: 'log-' + Date.now(), title, date: new Date().toLocaleString('ja-JP'), messages: msgs, history: hist }];
    setLogs(next);
    saveLogs(next);
  };

  const send = async (text: string, image?: string) => {
    if (busy) return;
    setBusy(true);
    const userMsg: Message = { id: 'u-' + Date.now(), sender: 'user', text, image };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, image, history }),
      });
      const data = await res.json();
      const answer = data.error ? data.message || 'うまくつながりませんでした。少し待ってから、もう一度お試しください。' : data.text || '';
      const aiMsg: Message = { id: 'a-' + Date.now(), sender: 'assistant', text: answer };
      const finalMessages = [...nextMessages, aiMsg];
      const nextHistory: ChatTurn[] = [...history, { role: 'user', text }, { role: 'model', text: answer }];
      setMessages(finalMessages);
      setHistory(nextHistory);
      if (!data.error) persistLog(finalMessages, nextHistory);
    } catch {
      setMessages([...nextMessages, { id: 'a-' + Date.now(), sender: 'assistant', text: 'うまくつながりませんでした。少し待ってから、もう一度お試しください。' }]);
    }
    setBusy(false);
  };

  const reset = () => {
    setMessages([]);
    setHistory([]);
  };

  const openLog = (log: LogEntry) => {
    setMessages(log.messages);
    setHistory(log.history);
    setTab('chat');
  };

  const clearLogs = () => {
    setLogs([]);
    saveLogs([]);
  };

  return (
    <div style={{ fontSize: FONT_PX[fontSize] }}>
      <main className="max-w-[720px] mx-auto px-4 pt-4 pb-10">
        <Header fontSize={fontSize} onCycleFontSize={cycleFont} />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button className="ys-btn font-bold" style={tab === 'chat' ? { background: 'var(--main)', color: 'var(--on-main)', borderColor: 'var(--main)' } : undefined} onClick={() => setTab('chat')}>
            そうだんする
          </button>
          <button className="ys-btn font-bold" style={tab === 'security' ? { background: 'var(--main)', color: 'var(--on-main)', borderColor: 'var(--main)' } : undefined} onClick={() => setTab('security')}>
            あやしい？を調べる
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 mb-4">
          <button className="ys-btn font-bold" style={tab === 'logs' ? { background: 'var(--main)', color: 'var(--on-main)', borderColor: 'var(--main)' } : undefined} onClick={() => setTab('logs')}>
            相談ログ
          </button>
        </div>

        {tab === 'chat' && (
          <ChatPanel messages={messages} showTemplates={messages.length === 0} busy={busy} onSend={send} onReset={reset} />
        )}
        {tab === 'security' && <SecurityCenter />}
        {tab === 'logs' && <LogPanel logs={logs} onOpen={openLog} onClear={clearLogs} />}
      </main>
    </div>
  );
}
