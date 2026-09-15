'use client';
import React from 'react';

/** Markdown ringan (##, -, **tebal**) -> elemen React. Sama dengan versi HTML. */
export function Md({ text }: { text: string }) {
  const inline = (t: string, key: string) => {
    const out: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0, m: RegExpExecArray | null, i = 0;
    while ((m = re.exec(t))) {
      if (m.index > last) out.push(t.slice(last, m.index));
      if (m[1]) out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
      else out.push(<em key={`${key}-i${i++}`}>{m[2]}</em>);
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push(t.slice(last));
    return out;
  };

  const nodes: React.ReactNode[] = [];
  let ul: React.ReactNode[] = [];
  const flush = (key: string) => {
    if (ul.length) { nodes.push(<ul key={`ul-${key}`}>{ul}</ul>); ul = []; }
  };

  String(text || '').split('\n').forEach((raw, idx) => {
    const l = raw.trim();
    if (/^#{1,4}\s+/.test(l)) { flush(String(idx)); nodes.push(<h4 key={idx}>{inline(l.replace(/^#{1,4}\s+/, ''), String(idx))}</h4>); return; }
    if (/^([-*•]|\d+\.)\s+/.test(l)) { ul.push(<li key={idx}>{inline(l.replace(/^([-*•]|\d+\.)\s+/, ''), String(idx))}</li>); return; }
    if (!l) { flush(String(idx)); return; }
    flush(String(idx));
    nodes.push(<p key={idx}>{inline(l, String(idx))}</p>);
  });
  flush('end');
  return <div className="ai-out">{nodes}</div>;
}
