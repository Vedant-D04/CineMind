'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, Film, LoaderCircle, Upload, X } from 'lucide-react';
import { parseFootageReview, rehearsalReview, type FootageFrame, type FootageReview, type SceneBrief, type Shot, type DirectorExploration } from '@/lib/cinemind';
import { sampleFootage } from '@/lib/footageSampling';
import DirectorNotesPanel from './DirectorNotesPanel';
import FrameAlternative from './FrameAlternative';
import SubjectStudy from './SubjectStudy';
import FrameAnnotations from './FrameAnnotations';
import ShotChecklist from './ShotChecklist';
const stamp = (time: number) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toFixed(1).padStart(4, '0')}`;
interface Clip { name: string; url: string; duration: number; frames: FootageFrame[]; width: number; height: number }
export default function FootageWorkspace({ brief, shot, mode, onBusy, visible = true }: { visible?: boolean; brief: SceneBrief; shot: Shot | null; mode: 'meta' | 'rehearsal'; onBusy: (busy: boolean) => void }) {
  const [clip, setClip] = useState<Clip | null>(null), [report, setReport] = useState<FootageReview | null>(null);
  const [busy, setBusy] = useState<'reading' | 'reviewing' | null>(null), [error, setError] = useState('');
  const [active, setActive] = useState(0), [selected, setSelected] = useState<string | null>(null);
  const [view,setView] = useState<'watch'|'notes'|'compare'>('watch');
  const [idea,setIdea] = useState<DirectorExploration|null>(null),[visualBusy,setVisualBusy] = useState(false);
  const [source, setSource] = useState('');
  const player = useRef<HTMLVideoElement>(null), snapshot = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null), generation = useRef(0), clipUrl = useRef('');
  useEffect(() => () => { generation.current++; controller.current?.abort(); URL.revokeObjectURL(clipUrl.current);  }, [onBusy]);
  useEffect(() => { generation.current++; controller.current?.abort(); setReport(null); setError(''); setBusy(null); setIdea(null); setView('watch'); }, [brief, shot, mode, onBusy]);
  useEffect(()=>{onBusy(!!busy||visualBusy);},[busy,visualBusy,onBusy]);
  useEffect(()=>()=>onBusy(false),[onBusy]);
  useEffect(()=>{if(!visible)player.current?.pause();},[visible]);
  function cancel() { generation.current++; controller.current?.abort(); setBusy(null);  }
  function clear() { cancel(); player.current?.pause(); URL.revokeObjectURL(clipUrl.current); clipUrl.current = ''; setClip(null); setReport(null); setView('watch'); setIdea(null); setSelected(null); setError(''); }
  async function upload(file?: File) {
    if (!file) return;
    clear(); const run = ++generation.current; const abort = new AbortController(); controller.current = abort;
    setBusy('reading'); 
    try {
      const data = await sampleFootage(file, abort.signal);
      if (generation.current !== run) return;
      const url = URL.createObjectURL(file); clipUrl.current = url; setClip({ name: file.name, url, ...data }); setActive(0);
    } catch (e) { if (generation.current === run) setError(e instanceof Error ? e.message : 'Unable to open this footage.'); }
    finally { if (generation.current === run) { setBusy(null);  } }
  }
  async function review() {
    if (!clip) return;
    const run = ++generation.current, abort = new AbortController(); controller.current = abort;
    setBusy('reviewing');  setError(''); setReport(null); setSelected(null); player.current?.pause();
    try {
      if (mode === 'rehearsal') {
        setReport({ summary: 'Rehearsal only: no footage was analyzed. Use these four moments for your own review.', uncertainty: 'Static self-review prompts do not evaluate your recording, movement or audio.', samples: clip.frames.map(f => ({ time: f.time, review: rehearsalReview })) }); setSource('REHEARSAL / NOT AI ANALYSIS'); setView('notes'); return;
      }
      const response = await fetch('/api/copilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abort.signal, body: JSON.stringify({ action: 'footage', brief, shot, duration: clip.duration, frames: clip.frames }) });
      const data = await response.json();
      if (generation.current !== run) return;
      if (!response.ok) throw new Error(data.error || 'Unable to review footage.');
      // Server returns derived suggestions too; validate the underlying complete checks again.
      const parsed = parseFootageReview(data.footageReview, clip.frames);
      if (!parsed) throw new Error('No complete timestamped review was returned. Try again.');
      setReport(parsed); setSource(data.model); setActive(0); setIdea(null); setView('notes');
    } catch (e) { if (generation.current === run) setError(e instanceof Error ? e.message : 'Unable to review footage.'); }
    finally { if (generation.current === run) { setBusy(null);  } }
  }
  function jump(index: number) {
    setActive(index); setSelected(null); setIdea(null);
    if (player.current && clip) { player.current.pause(); player.current.currentTime = clip.frames[index].time; }
  }
  function locate(id: string) { setSelected(id); snapshot.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  function exportReport() {
    if (!report || !clip) return;
    const notes = ['CINEMIND / RECORDED FOOTAGE REVIEW', `File: ${clip.name}`, `Format: ${brief.format || 'film'}`, `Source: ${source}`, `Scene: ${brief.scene}`, `Intention: ${brief.intention}`, `Constraints: ${brief.constraints}`, brief.look ? `Chosen look: ${brief.look.name}` : '', report.summary, ...report.samples.filter(s=>s.review.director).map(s=>`DIRECTOR’S NOTES ${stamp(s.time)}\n${s.review.director!.reading}\nKeep: ${s.review.director!.strength}\n${s.review.director!.explorations.map(e=>`${e.title} (${e.feasibility})\n${e.observation}\nTry: ${e.experiment}\nFor this scene: ${e.effect}\nTradeoff: ${e.tradeoff}`).join('\n\n')}\n${s.review.director!.question}`), `Limits: ${report.uncertainty}`, ...report.samples.map(s => `${stamp(s.time)}\n${s.review.observation}\n${s.review.alignment}\n${s.review.checklist?.map(c => `${c.category}: ${c.status}\n${c.evidence}\n${c.action}\n${c.reason}`).join('\n\n') || s.review.suggestions.map(c => `${c.action} — ${c.reason}`).join('\n')}\n${s.review.uncertainty}`)].join('\n\n');
    const url = URL.createObjectURL(new Blob([notes], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'cinemind-footage-review.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const sample = clip?.frames[active], check = report?.samples[active]?.review;
  function visualize(next: DirectorExploration) { player.current?.pause(); setIdea(next); setView('compare'); }
  return <section className="cine-panel footage-workspace footage-editor" aria-labelledby="footage-title">
    <div className="cine-section-label"><span>REVIEW A TAKE / {brief.format === 'reel' ? 'REELS' : 'FILM'}</span><Film size={18}/></div>
    <h2 id="footage-title" tabIndex={-1}>Your take. Another perspective.</h2><p className="cine-muted">A director’s conversation about your scene, followed by visual alternatives from your own footage.</p>
    {!clip ? <div className="footage-upload-empty"><Film size={36} strokeWidth={1}/><h3>Bring the take you’ve already filmed.</h3><p>We’ll look at it through your intention: “{brief.intention}”</p><label className="cine-primary cine-upload"><Upload size={16}/>{busy==='reading'?'Preparing your take…':'Upload recorded video'}<input aria-label="Upload recorded video" type="file" accept="video/mp4,video/webm,video/quicktime" disabled={!!busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label>{busy&&<button className="cine-text-link" onClick={cancel}><X size={14}/>Cancel</button>}<small>Up to 60 seconds / 100 MB · playable MP4, WebM or MOV</small></div> : <>
      <div className="footage-source-bar"><div><strong>{clip.name}</strong><span>{clip.duration.toFixed(1)} seconds · 4 sampled moments · {source||'Ready to review'}</span></div><label className="cine-text-link cine-upload">Replace<input aria-label="Replace recorded video" type="file" accept="video/mp4,video/webm,video/quicktime" disabled={!!busy||visualBusy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label><button className="cine-text-link" disabled={!!busy||visualBusy} onClick={clear}>Remove</button></div>
      <div className="footage-view-tabs" aria-label="Footage workspace view">{([{id:'watch',label:'Watch your take'},{id:'notes',label:'Director’s notes'},{id:'compare',label:'Visual alternatives'}] as const).map(tab=><button key={tab.id} aria-pressed={view===tab.id} disabled={visualBusy||(tab.id==='notes'&&!report)} onClick={()=>{player.current?.pause();setView(tab.id);}}>{tab.label}</button>)}</div>
      <div hidden={view!=='watch'}><div className="footage-player"><video ref={player} src={clip.url} controls playsInline preload="metadata" aria-label="Your recorded footage"/></div><div className="footage-scene-reminder"><span>YOUR SCENE REQUIREMENT</span><p>{brief.intention}</p><details><summary>Read scene & resources</summary><p>{brief.scene}</p><p>{brief.constraints}</p></details></div></div>
      <div className="footage-actions"><button className="cine-primary" disabled={!!busy||visualBusy} onClick={()=>void review()}>{busy==='reviewing'?<LoaderCircle className="cine-spin" size={16}/>:<Film size={16}/>} {busy==='reviewing'?'Reading the scene in your take…':mode==='meta'?(report?'Revisit the director’s notes':'Get director’s notes'):'Open footage self-review'}</button>{busy&&<button className="cine-text-link" onClick={cancel}><X size={14}/>Cancel</button>}{report&&<button className="cine-text-link" onClick={exportReport}><Download size={15}/>Export notes</button>}</div>
      {report&&view==='watch'&&<div className="footage-summary"><p className="cine-eyebrow">MUSE SPARK / HOW THE TAKE SERVES YOUR SCENE</p><p>{report.summary}</p></div>}
      <div className="footage-timeline" aria-label="Sampled moments">{clip.frames.map((frame,i)=><button key={frame.time} disabled={visualBusy} aria-pressed={active===i} onClick={()=>jump(i)}><img src={frame.image} alt={`Recorded sample at ${stamp(frame.time)}`}/><span>{stamp(frame.time)}</span><small>{report?.samples[i].review.director?'Explore this moment':report?'Self-review':'Sampled frame'}</small></button>)}</div>
      {sample&&<>
        <div hidden={view!=='notes'} className="footage-report-grid"><div className="footage-image-column"><p className="cine-eyebrow">YOUR FRAME / {stamp(sample.time)}</p><div className="footage-snapshot" ref={snapshot}><img src={sample.image} alt={`Exact analyzed frame at ${stamp(sample.time)}`}/>{check?.checklist&&<FrameAnnotations checks={check.checklist} mediaWidth={clip.width} mediaHeight={clip.height} selected={selected} onSelect={locate}/>}</div><p className="cine-footnote">Callouts belong to this frozen frame.</p>{check&&<details className="footage-observation"><summary>What’s visible in this frame</summary><p>{check.observation}</p><p>{check.alignment}</p><small>{check.uncertainty}</small></details>}<SubjectStudy image={sample.image} brief={brief} shot={shot} mode={mode} context="recorded" onStart={()=>player.current?.pause()}/></div><div>{check?.director?<DirectorNotesPanel notes={check.director} brief={brief} onVisualize={visualize}/>:<div className="footage-observation"><h3>{report?'Your self-review prompts':'Your scene comes first.'}</h3>{report?rehearsalReview.suggestions.map(s=><p key={s.action}>{s.action} {s.reason}</p>):<p>Request director’s notes to explore how this take serves your intention.</p>}</div>}{check?.checklist&&<details className="footage-craft-appendix"><summary>Full craft notes · all six areas</summary><ShotChecklist idPrefix="footage-check" checks={check.checklist} selected={selected} onLocate={locate}/></details>}</div></div>
        <div hidden={view!=='compare'}><FrameAlternative key={clip.url+'-'+active} image={sample.image} timeLabel={stamp(sample.time)} brief={brief} shot={shot} idea={idea} mode={mode} onBusy={setVisualBusy}/></div>
      </>}
      {report&&<p className="cine-footnote">{report.uncertainty}</p>}
    </>}
    {error&&<p className="cine-error" role="alert">{error}</p>}
    <p className="cine-footnote">{mode==='meta'?'Reviews send four sampled frames with your scene, feeling, resources and selected look. Full video and audio stay on this device; short events between samples can be missed.':'Rehearsal offers self-review without AI calls. Choose Meta live in the top bar for director’s notes and image alternatives.'} Your clip stays while you edit the intention. Returning to all workflows or removing footage clears it.</p>
  </section>;
}
