'use client';

import { Check, LoaderCircle, Palette } from 'lucide-react';
import type { ColorLook } from '@/lib/cinemind';

export function LookSwatches({ look }: { look: ColorLook }) {
  return <div className="look-swatches" aria-label={`${look.name} color palette`}>{look.colors.map((color, i) => <div key={`${color.hex}-${i}`}><span style={{ backgroundColor: color.hex }} /><small>{color.hex}</small><em>{color.role}</em></div>)}</div>;
}
export default function LookLab({ selected, looks, source, disabled, pending, ready, onGenerate, onSelect }: {
  selected?: ColorLook; looks: ColorLook[]; source: 'meta' | 'rehearsal'; disabled: boolean; pending: boolean; ready: boolean;
  onGenerate: () => void; onSelect: (look?: ColorLook) => void;
}) {
  return <section className="look-lab" aria-labelledby="look-lab-title">
    <div className="look-heading"><div><p className="cine-eyebrow">LOOK LAB / OPTIONAL</p><h3 id="look-lab-title"><Palette size={20} />Give the feeling a color.</h3></div><span>01 — 03</span></div>
    <p className="cine-muted">Start with your intended mood and situation. Explore three directions, then keep one—or none.</p>
    <div className="look-controls"><button type="button" className="cine-secondary" disabled={disabled || !ready} onClick={onGenerate}>{pending ? <LoaderCircle className="cine-spin" size={16} /> : <Palette size={16} />}{pending ? 'Mixing three directions…' : source === 'meta' ? 'Explore AI palettes' : 'Explore sample palettes'}</button>{selected && <button type="button" className="cine-text-link" disabled={disabled} onClick={() => onSelect(undefined)}>Clear chosen look</button>}</div>
    {!ready && <p className="cine-footnote">Describe your scene and intended feeling first.</p>}
    {!!looks.length && <><p className="cine-footnote">{source === 'meta' ? 'AI proposals based on your brief. No camera image was analyzed.' : 'Static palette exercises. These are not AI recommendations for your scene.'}</p><div className="look-options">{looks.map((look, i) => <article className={`look-card ${selected?.id === look.id ? 'is-selected' : ''}`} key={look.id}>
      <div className="look-card-title"><small>LOOK / 0{i + 1}</small><h4>{look.name}</h4></div><LookSwatches look={look} /><p>{look.interpretation}</p>
      <details><summary>Build this look</summary><dl><dt>Light</dt><dd>{look.lighting}</dd><dt>Wardrobe & surroundings</dt><dd>{look.styling}</dd><dt>Optional grade</dt><dd>{look.grading}</dd><dt>The tradeoff</dt><dd>{look.tradeoff}</dd></dl></details>
      <button type="button" className={selected?.id === look.id ? 'cine-primary' : 'cine-secondary'} disabled={disabled} aria-pressed={selected?.id === look.id} onClick={() => onSelect(look)}>{selected?.id === look.id && <Check size={15} />}{selected?.id === look.id ? 'Chosen look' : 'Use this direction'}</button>
    </article>)}</div></>}
    {selected && !looks.some(l => l.id === selected.id) && <div className="look-saved"><strong>Chosen look · {selected.name}</strong><LookSwatches look={selected} /><p>{selected.interpretation}</p></div>}
    <p className="cine-footnote">Color is a creative choice, not an emotion detector. Suggestions guide your setup; they don’t apply a filter to the camera.</p>
  </section>;
}
