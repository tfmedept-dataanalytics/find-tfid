'use client';
import React from 'react';

export interface Datum { k: string; v: number; c?: string }

export function HBar({ data, labelW = 150 }: { data: Datum[]; labelW?: number }) {
  if (!data.length) return <div className="empty small muted">Belum ada data untuk ditampilkan.</div>;
  const max = Math.max(...data.map(d => d.v), 1);
  const rowH = 22, pad = 4, w = 560;
  const h = data.length * rowH + pad * 2;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMinYMin meet" role="img">
      {data.map((d, i) => {
        const y = pad + i * rowH;
        const bw = Math.max(2, (d.v / max) * (w - labelW - 42));
        const lbl = d.k.length > 26 ? d.k.slice(0, 25) + '…' : d.k;
        return (
          <g key={d.k + i}>
            <title>{`${d.k}: ${d.v}`}</title>
            <text className="lbl" x={labelW - 8} y={y + 14} textAnchor="end">{lbl}</text>
            <rect x={labelW} y={y + 4} width={bw} height={14} rx={3} fill={d.c || 'var(--green-700)'} />
            <text className="val" x={labelW + bw + 6} y={y + 15}>{d.v}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function VBar({ data }: { data: Datum[] }) {
  if (!data.length) return <div className="empty small muted">Belum ada data untuk ditampilkan.</div>;
  const max = Math.max(...data.map(d => d.v), 1);
  const w = 560, h = 170, padB = 26, padT = 16, bw = (w - 10) / data.length;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMinYMin meet" role="img">
      <line x1="5" y1={h - padB} x2={w - 5} y2={h - padB} stroke="var(--line)" />
      {data.map((d, i) => {
        const bh = (d.v / max) * (h - padB - padT);
        const x = 5 + i * bw, y = h - padB - bh;
        return (
          <g key={d.k + i}>
            <title>{`${d.k}: ${d.v}`}</title>
            <rect x={x + bw * 0.18} y={y} width={bw * 0.64} height={Math.max(1, bh)} rx={3} fill={d.c || 'var(--green-500)'} />
            <text className="val" x={x + bw / 2} y={y - 4} textAnchor="middle">{d.v || ''}</text>
            <text x={x + bw / 2} y={h - 9} textAnchor="middle">{d.k}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Meter({ value, max = 100, width }: { value: number; max?: number; width?: string }) {
  const r = value / max;
  const cls = r < 0.5 ? 'r' : r < 0.8 ? 'a' : '';
  return (
    <div className={`meter ${cls}`} style={width ? { width } : undefined}>
      <i style={{ width: `${Math.max(0, Math.min(100, r * 100))}%` }} />
    </div>
  );
}
