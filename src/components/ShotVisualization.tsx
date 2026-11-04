'use client';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import type { SceneBrief, Shot } from '@/lib/cinemind';
export default function ShotVisualization({ brief, shot, mode }: { brief: SceneBrief; shot: Shot; mode: 'meta' | 'rehearsal' }) {
  const [direction,setDirection] = useState(''), [image,setImage] = useState(''), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const abort = useRef<AbortController | null>(null), generation = useRef(0);
  const contextKey = JSON.stringify({brief,shot,mode});
  useEffect(()=>{ generation.current++; abort.current?.abort(); setBusy(false); setImage(''); setError(''); return ()=>{generation.current++;abort.current?.abort();}; },[contextKey]);
  async function generate() {
    const run = ++generation.current, controller = new AbortController(); abort.current=controller; setBusy(true);setError('');
    try {
      const response = await fetch('/api/visuals',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({action:'visualize',brief,shot,direction})});
      const data=await response.json();if(generation.current!==run)return;
      if(!response.ok)throw new Error(data.error||'Unable to visualize this shot.');setImage(data.image);
    } catch(e){if(generation.current===run)setError(e instanceof Error?e.message:'Unable to generate preview.');}
    finally{if(generation.current===run)setBusy(false);}
  }
  return <details className="shot-visualization"><summary><ImagePlus size={15}/><span>Visualize this shot <small>Muse Image</small></span></summary><div>
    <label>Your direction <span className="cine-footnote">Optional</span><textarea rows={2} maxLength={600} disabled={busy} value={direction} onChange={e=>setDirection(e.target.value)} placeholder="Keep it naturalistic. Explore softer light…"/></label>
    <button type="button" className="cine-secondary" disabled={busy||mode!=='meta'} onClick={()=>void generate()}>{busy?<LoaderCircle size={15} className="cine-spin"/>:<ImagePlus size={15}/>} {busy?'Visualizing…':image?'Generate another option':'Generate one shot preview'}</button>
    {busy&&<button type="button" className="cine-text-link" onClick={()=>{generation.current++;abort.current?.abort();setBusy(false);}}><X size={14}/>Cancel</button>}
    <p className="cine-footnote">{mode==='meta'?'One Muse Image generation per click. Based on your brief, this shot, selected reference traits and chosen palette.':'Choose Meta live to generate a preview. Rehearsal makes no image calls.'}</p>
    {error&&<p role="alert" className="cine-error">{error}</p>}
    {image&&<figure><img src={image} alt={`Muse Image generated shot study: ${shot.title}`}/><figcaption>MUSE IMAGE / GENERATED PREVIS · An option to consider, not your actual footage.</figcaption><a href={image} download={`cinemind-${shot.id.replace(/[^a-z0-9-]/gi,'').slice(0,60)}-previs.${image.startsWith('data:image/png') ? 'png' : image.startsWith('data:image/jpeg') ? 'jpg' : 'webp'}`} className="cine-text-link">Download shot study</a></figure>}
  </div></details>;
}
