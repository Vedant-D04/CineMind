'use client';
import { useEffect, useRef, useState } from 'react';
import { Focus, LoaderCircle, X } from 'lucide-react';
import type { SceneBrief, Shot } from '@/lib/cinemind';
import { subjectMeasurements, type SubjectSegmentation, type CompositionStudy } from '@/lib/visualTypes';

export default function SubjectStudy({ image, brief, shot, mode, context = 'camera', onStart }: { image: string; brief: SceneBrief; shot?: Shot | null; mode: 'meta' | 'rehearsal'; context?: 'camera' | 'recorded'; onStart?: () => void }) {
  const [prompt, setPrompt] = useState('person'), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const [size,setSize] = useState({width:0,height:0}), [result,setResult] = useState<SubjectSegmentation | null>(null);
  const [composition,setComposition] = useState<CompositionStudy | null>(null), [warning,setWarning] = useState('');
  const [showMasks,setShowMasks] = useState(true);
  const abort = useRef<AbortController | null>(null), generation = useRef(0);
  useEffect(() => {
    generation.current++; abort.current?.abort(); setBusy(false); setResult(null); setComposition(null); setError(''); setWarning(''); setSize({width:0,height:0});
    const picture = new Image(); picture.onload = () => setSize({width:picture.naturalWidth,height:picture.naturalHeight}); picture.src = image;
    return () => { picture.onload = null; generation.current++; abort.current?.abort(); };
  }, [image,brief,shot,mode]);
  function cancel() { generation.current++; abort.current?.abort(); setBusy(false); }
  async function segment() {
    onStart?.(); const run = ++generation.current; const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(''); setResult(null); setComposition(null); setWarning('');
    try {
      const response = await fetch('/api/visuals', {method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({action:'segment',image,prompt:prompt.trim(),...size,brief,shot,context})});
      const data = await response.json(); if (generation.current !== run) return;
      if (!response.ok) throw new Error(data.error || 'Unable to segment this subject.');
      setResult(data.segmentation); setComposition(data.composition); setWarning(data.compositionWarning || '');
    } catch(e) { if (generation.current === run) setError(e instanceof Error ? e.message : 'Segmentation failed.'); }
    finally { if (generation.current === run) setBusy(false); }
  }
  const metrics = result ? subjectMeasurements(result) : [];
  return <details className="subject-study"><summary><Focus size={16} /><span>Subject study <small>SAM 3.1 / precise masks & composition</small></span></summary><div className="subject-study-content">
    <p>Find a subject’s pixel region, then let Muse Spark relate its placement to your intention.</p>
    <label>What should SAM find?<input value={prompt} maxLength={80} disabled={busy} onChange={e=>setPrompt(e.target.value)} placeholder="person, tennis racket, chair…" /></label>
    <div className="footage-actions"><button type="button" className="cine-secondary" disabled={busy || mode !== 'meta' || !size.width || !prompt.trim()} onClick={() => void segment()}>{busy ? <LoaderCircle size={15} className="cine-spin" /> : <Focus size={15} />}{busy ? 'Segmenting & studying…' : 'Segment & assess composition'}</button>{busy && <button type="button" className="cine-text-link" onClick={cancel}><X size={14} />Cancel</button>}</div>
    <p className="cine-footnote">{mode !== 'meta' ? 'Choose Meta live to use SAM. Rehearsal does not generate masks.' : 'One SAM image request; when a subject is found, one Muse Spark interpretation. Starting pauses live guidance. No continuous tracking.'}</p>
    {error && <p role="alert" className="cine-error">{error}</p>}{warning && <p role="status" className="cine-footnote">{warning}</p>}
    {result && <><div className="subject-study-header"><strong>SAM 3.1 · {result.subjects.length} matches</strong><label><input type="checkbox" checked={showMasks} onChange={e=>setShowMasks(e.target.checked)} />Show masks</label></div>
      <div className="subject-mask-frame" style={{aspectRatio:`${result.width}/${result.height}`}}><img src={image} alt="The frozen image segmented by SAM 3.1" />{showMasks && <svg viewBox={`0 0 ${result.width} ${result.height}`} aria-label="SAM subject segmentation masks">{result.subjects.map((s,i)=><g key={s.id}><path d={s.path} transform={`translate(${s.bounds.left} ${s.bounds.top}) scale(${(s.bounds.right-s.bounds.left)/s.maskWidth} ${(s.bounds.bottom-s.bounds.top)/s.maskHeight})`} fill={i % 2 ? '#54c2d9' : '#efc568'} fillOpacity=".4" /><rect x={s.bounds.left} y={s.bounds.top} width={s.bounds.right-s.bounds.left} height={s.bounds.bottom-s.bounds.top} fill="none" stroke={i % 2 ? '#54c2d9' : '#efc568'} strokeWidth={Math.max(1,result.width/500)} /><circle cx={s.center.x*result.width} cy={s.center.y*result.height} r={Math.max(3,result.width/130)} fill="#fff" /></g>)}</svg>}</div>
      {!result.subjects.length ? <p>No match found for “{result.prompt}”. Try a more concrete subject phrase; no mask is fabricated.</p> : <div className="subject-metrics">{metrics.map(m=><div key={m.id}><strong>Subject {m.id} · {(m.frameCoverage*100).toFixed(1)}% of frame</strong><span>Mask center: {(m.center.x*100).toFixed(0)}% across / {(m.center.y*100).toFixed(0)}% down</span><span>Bounding margins L / T / R / B: {Object.values(m.margins).map(v=>`${(v*100).toFixed(1)}%`).join(' / ')}</span></div>)}</div>}
      {composition && <div className="subject-composition"><p className="cine-eyebrow">MUSE SPARK / SUBJECT-AWARE COMPOSITION</p><p>{composition.observation}</p>{composition.options.map((o,i)=><div key={i}><strong>{o.action}</strong><p>{o.reason}</p></div>)}<small>{composition.uncertainty}</small></div>}
      <p className="cine-footnote">Mask-derived geometry on this image only. A mask centroid is not a face or gaze estimate; touching an edge is not automatically a mistake.</p>
    </>}
  </div></details>;
}
