import React, { useRef, useState } from 'react';
import { Message } from '../types';
import { TemplateGrid } from './TemplateGrid';
import { StepVisual } from './StepVisual';

interface Props {
  messages: Message[];
  showTemplates: boolean;
  busy: boolean;
  onSend: (text: string, image?: string) => void;
  onReset: () => void;
}

const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function ChatPanel({ messages, showTemplates, busy, onSend, onReset }: Props) {
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const startMic = () => {
    if (!SR) return;
    try {
      const r = new SR();
      r.lang = 'ja-JP';
      r.onresult = (e: any) => setInput(e.results[0][0].transcript);
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text && !pendingImage) return;
    onSend(text, pendingImage || undefined);
    setInput('');
    setPendingImage(null);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <section>
      {showTemplates && <TemplateGrid onPick={(t) => onSend(t)} />}

      <div aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`ys-card my-2.5 ${m.sender === 'user' ? 'ml-6' : 'mr-2'}`} style={m.sender === 'user' ? { background: 'var(--me)' } : undefined}>
            <div className="whitespace-pre-wrap break-words">{m.text || (m.image ? '（画面の写真を送りました）' : '')}</div>
            {m.image && <img src={m.image} alt="送った画面の写真" className="max-w-[160px] rounded-lg mt-1.5" />}
            {m.sender === 'assistant' && m.text && (
              <>
                <div className="flex gap-2 flex-wrap mt-2">
                  <button className="ys-btn" onClick={() => speak(m.text)}>読みあげる</button>
                </div>
                <StepVisual text={m.text} />
              </>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <h2 className="text-lg mt-5 mb-2">自分の言葉で聞く</h2>
      <textarea
        className="w-full rounded-2xl p-3 min-h-[110px]"
        style={{ background: 'var(--card)', border: '2px solid var(--line)', color: 'var(--ink)' }}
        placeholder="例：LINEの写真がひらけません"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {pendingImage && (
        <div className="mt-2">
          <img src={pendingImage} alt="選んだ写真" className="max-w-[140px] rounded-lg block" />
          <button className="ys-btn mt-1" onClick={() => setPendingImage(null)}>写真をやめる</button>
        </div>
      )}
      <div className="flex gap-2 flex-wrap mt-2">
        <button className="ys-btn font-bold" style={{ background: 'var(--main)', color: 'var(--on-main)', borderColor: 'var(--main)' }} disabled={busy} onClick={send}>
          送る
        </button>
        {SR && (
          <button className="ys-btn" onClick={startMic}>{listening ? '聞いています…' : 'こえで話す'}</button>
        )}
        <button className="ys-btn" onClick={() => fileRef.current?.click()}>画面の写真を見せる</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
        {!showTemplates && <button className="ys-btn" onClick={onReset}>はじめから</button>}
      </div>
      <p className="text-sm mt-2" style={{ color: 'var(--sub)' }}>
        機種（iPhone か Android）を先に聞くことがあります。AIの案内は、間違うこともあります。
      </p>
    </section>
  );
}
