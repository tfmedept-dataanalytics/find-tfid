'use client';
import { LVL_LABEL, LVL_PILL, type Insight } from '@/lib/rules';

/** Daftar butir insight. `bare` menampilkan tanpa kartu pembungkus. */
export function InsightList({ items, kosong }: { items: Insight[]; kosong?: string }) {
  if (!items.length) return kosong ? <div className="small muted">{kosong}</div> : null;
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className={`flag ${it.lvl === 'kritis' ? 'e' : it.lvl === 'perhatian' ? 'w' : 'o'}`}
          style={{ alignItems: 'flex-start' }}>
          <span className="ic"><span className={`pill ${LVL_PILL[it.lvl]}`}>{LVL_LABEL[it.lvl]}</span></span>
          <div className="tx">
            <b>{it.judul}</b>{it.teks}
            {it.bukti && (
              <div className="tiny muted" style={{ marginTop: '.3rem', lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: it.bukti }} />
            )}
          </div>
        </div>
      ))}
    </>
  );
}

export function InsightCard(
  { items, judul, hint, footer, kosong }:
  { items: Insight[]; judul: string; hint: string; footer?: string; kosong?: string }
) {
  if (!items.length && !kosong) return null;
  return (
    <div className="card mb">
      <div className="card-h"><h3>{judul}</h3><span className="hint">{hint}</span></div>
      <div className="card-b">
        <InsightList items={items} kosong={kosong} />
        {footer && <div className="tiny muted mt-s" style={{ lineHeight: 1.55 }}>{footer}</div>}
      </div>
    </div>
  );
}
