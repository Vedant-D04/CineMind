'use client';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import type { DirectorExploration, SceneBrief, Shot } from '@/lib/cinemind';
const factors = [{id:'composition',label:'Framing & space'},{id:'lighting',label:'Light & contrast'},{id:'color',label:'Color & mood'},{id:'background',label:'Background attention'}];
export default function FrameAlternative({ image, timeLabel, brief, shot, idea, mode, onBusy }: { image: string; timeLabel: string; brief: SceneBrief; shot: Shot | null; idea: DirectorExploration | null; mode: 'meta'|'rehearsal'; onBusy: (busy:boolean)=>void }) {
  const [direction,setDirection]=useState(''), [selected,setSelected]=useState(['composition','lighting','color']);
  const [scope,setScope]=useState<'edit'|'reshoot'>('edit'), [result,setResult]=useState<{image:string;scope:string;direction:string;factors:string[]}|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const controller=useRef<AbortController|null>(null),generation=useRef(0);
  const context=JSON.stringify({image,brief,shot,idea,mode});
  useEffect(()=>{
    generation.current++;controller.current?.abort();setBusy(false);onBusy(false);setResult(null);setError('');
    setDirection(idea?`${idea.title}. ${idea.experiment} Intended effect: ${idea.effect} Preserve the scene's core action.`:'Explore an alternative that better supports my stated scene and feeling. Preserve the subject, location and moment.');
    setScope(idea?.feasibility==='reshoot'?'reshoot':'edit'); setSelected(idea?.factors?.length?[...idea.factors]:['composition','lighting','color']);
    return()=>{generation.current++;controller.current?.abort();onBusy(false);};
  },[context,onBusy]);
  function cancel(){generation.current++;controller.current?.abort();setBusy(false);onBusy(false);}
  async function generate(){
    const run=++generation.current,abort=new AbortController();controller.current=abort;setBusy(true);onBusy(true);setError('');
    try{
      const response=await fetch('/api/visuals',{method:'POST',headers:{'Content-Type':'application/json'},signal:abort.signal,body:JSON.stringify({action:'reimagine',brief,shot,image,direction,factors:selected,scope})});
      const data=await response.json();if(generation.current!==run)return;
      if(!response.ok)throw new Error(data.error||'Unable to visualize this alternative.');
      setResult({image:data.image,scope,direction,factors:[...selected]});
    }catch(e){if(generation.current===run)setError(e instanceof Error?e.message:'Unable to visualize this frame.');}
    finally{if(generation.current===run){setBusy(false);onBusy(false);}}
  }
  return <section className="frame-alternative" aria-labelledby="alternative-title">
    <div className="alternative-heading"><div><p className="cine-eyebrow">YOUR FRAME → ANOTHER POSSIBILITY</p><h3 id="alternative-title">See what the direction could look like.</h3></div><span>MUSE IMAGE / IMAGE EDIT</span></div>
    <p className="cine-muted">Starts from your selected video frame at {timeLabel}. Choose what to explore; your original recording stays intact.</p>
    {idea&&<blockquote className="alternative-idea"><strong>{idea.title}</strong><p>{idea.effect}</p></blockquote>}
    <div className="alternative-controls"><div><fieldset disabled={busy}><legend>What should change?</legend><div className="alternative-factors">{factors.map(f=><label key={f.id}><input type="checkbox" checked={selected.includes(f.id)} onChange={e=>setSelected(e.target.checked?[...selected,f.id]:selected.filter(v=>v!==f.id))}/>{f.label}</label>)}</div></fieldset><label>How far should we explore?<select value={scope} disabled={busy} onChange={e=>setScope(e.target.value as 'edit'|'reshoot')}><option value="edit">Within the existing take — edit study</option><option value="reshoot">Imagine a reshoot — concept only</option></select></label></div><label>Your direction<textarea rows={4} maxLength={1800} disabled={busy} value={direction} onChange={e=>setDirection(e.target.value)}/></label></div>
    <div className="footage-actions"><button type="button" className="cine-primary" disabled={busy||mode!=='meta'||!selected.length||!direction.trim()} onClick={()=>void generate()}>{busy?<LoaderCircle size={16} className="cine-spin"/>:<ImagePlus size={16}/>} {busy?'Visualizing your frame…':result?'Explore another version':'Visualize an alternative'}</button>{busy&&<button type="button" className="cine-text-link" onClick={cancel}><X size={14}/>Cancel</button>}</div>
    <p className="cine-footnote">{mode==='meta'?'One Muse Image image-edit request per click. The actual selected frame is sent with your direction.':'Choose Meta live to visualize an alternative. Rehearsal does not generate images.'}</p>
    {error&&<p className="cine-error" role="alert">{error}</p>}
    <div className="alternative-comparison"><figure><figcaption><span>ORIGINAL FRAME</span><strong>{timeLabel} · your recording</strong></figcaption><img src={image} alt={`Original recorded frame at ${timeLabel}`}/></figure><figure className={!result?'alternative-awaiting':''}><figcaption><span>{result?'AI-GENERATED ALTERNATIVE':'YOUR NEXT POSSIBILITY'}</span><strong>{result?(result.scope==='reshoot'?'Reshoot concept':'Edit study'):'Choose a direction above'}</strong></figcaption>{result?<img src={result.image} alt={`Muse Image alternative based on your recorded frame at ${timeLabel}`}/>:<div className="alternative-placeholder"><ImagePlus size={36} strokeWidth={1}/><p>Your frame is the starting point.</p><small>Explore a direction to compare it here.</small></div>}</figure></div>
    {result&&<div className="alternative-result-notes"><p><strong>Direction used</strong> {result.direction}</p><p>Factors: {result.factors.map(id=>factors.find(f=>f.id===id)?.label).join(' · ')}</p><a className="cine-secondary" href={result.image} download={`cinemind-frame-alternative.${result.image.startsWith('data:image/png')?'png':result.image.startsWith('data:image/jpeg')?'jpg':'webp'}`}>Download alternative still</a></div>}
    <p className="cine-footnote">This is an AI still proposal, not an edited video or proof that a change is achievable. Generated details may differ. Edit studies target crop, exposure and color; new viewpoints, staging or light setups require a reshoot.</p>
  </section>;
}
