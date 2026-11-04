'use client';
import { useEffect, useRef, useState } from 'react';
import { containedMediaRect, SHOT_CHECKS, type ShotCheck } from '@/lib/cinemind';
export default function FrameAnnotations({ checks, mediaWidth, mediaHeight, selected, onSelect }: { checks?: ShotCheck[]; mediaWidth: number; mediaHeight: number; selected: string | null; onSelect: (id: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(root.current); return () => observer.disconnect();
  }, []);
  const bounds = containedMediaRect(size.width, size.height, mediaWidth, mediaHeight);
  return <div className="studio-frame-annotations" ref={root} aria-label="Approximate problem regions on the analyzed snapshot"><div style={{ position: 'absolute', ...bounds }}>{checks?.map(check => {
    const r = check.region;
    if (check.status !== 'attention' || !r) return null;
    const number = SHOT_CHECKS.findIndex(c => c.id === check.category) + 1;
    return <button key={check.category} className={`studio-region ${selected === check.category ? 'is-selected' : ''}`} aria-pressed={selected === check.category} aria-label={`${number}. ${r.label}. ${check.evidence}`} title={check.evidence} onClick={() => onSelect(check.category)} style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` }}><span>{number}</span>{selected === check.category && <strong>{r.label}</strong>}</button>;
  })}</div></div>;
}
