'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, Check, Clapperboard, Download, Film, Focus, LoaderCircle, Upload, X } from 'lucide-react';
import { exampleBrief, rehearsalShotsFor, rehearsalLooks, rehearsalReview, validBrief, validShot, type SceneBrief, type Shot, type FrameReview, type ReferenceStudy, type ColorLook } from '@/lib/cinemind';
import './copilot.css';
import SubjectStudy from './SubjectStudy';
import SceneBuilder from './SceneBuilder';
import StudioEntrance, { type StudioPath } from './StudioEntrance';
import ShotVisualization from './ShotVisualization';
import FootageWorkspace from './FootageWorkspace';
import LookLab, { LookSwatches } from './LookLab';
import CopilotTutorial from './CopilotTutorial';
import ShotChecklist from './ShotChecklist';
import FrameAnnotations from './FrameAnnotations';
import ReferenceInput, { type ReferenceFrame } from './ReferenceInput';
import { useLiveDirection, LIVE_REQUEST_LIMIT } from '@/lib/useLiveDirection';

type Mode = 'rehearsal' | 'meta';
interface Plan { referenceStudy?: ReferenceStudy; referencePassages?: { id: string; source: string; text: string }[]; brief: SceneBrief; shots: Shot[]; source: Mode; model?: string }
interface Review { result: FrameReview; source: Mode; model?: string }
const empty: SceneBrief = { scene: '', intention: '', constraints: '', format: 'film' };
export default function CopilotWorkspace() {
  const [showTour, setShowTour] = useState(false);
  const [entry,setEntry]=useState<StudioPath|null>(null);
  const [briefStep,setBriefStep]=useState(0);
  const [sceneApplied,setSceneApplied]=useState(false);
  const [stage, setStage] = useState(0);
  const [workflow,setWorkflow] = useState<'review'|'shoot'>('review');
  const [brief, setBrief] = useState<SceneBrief>(empty);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [chosen, setChosen] = useState<Shot | null>(null);
  const [mode, setMode] = useState<Mode>('rehearsal');
  const [configured, setConfigured] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<'plan' | 'review' | 'looks' | null>(null);
  const [looks, setLooks] = useState<ColorLook[]>([]);
  const [error, setError] = useState('');
  const [referenceFrames, setReferenceFrames] = useState<ReferenceFrame[]>([]);
  const [readingReference, setReadingReference] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [inspectSnapshot, setInspectSnapshot] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [showCallouts, setShowCallouts] = useState(true);
  const [stillSize, setStillSize] = useState({ width: 16, height: 9 });
  const [image, setImage] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [frameSize, setFrameSize] = useState({ width: 16, height: 9 });
  const [brightness, setBrightness] = useState<number | null>(null);
  const [grid, setGrid] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const cameraGeneration = useRef(0);
  const reviewSection = useRef<HTMLElement>(null);
  const monitor = useRef<HTMLDivElement>(null);
  const live = useLiveDirection(video, brief, chosen);
  useEffect(() => {
    if (!streaming) { setBrightness(null); return; }
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 36;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const timer = setInterval(() => {
      if (!context || !video.current?.videoWidth || document.hidden) return;
      context.drawImage(video.current, 0, 0, 64, 36);
      const pixels = context.getImageData(0, 0, 64, 36).data;
      let total = 0;
      for (let i = 0; i < pixels.length; i += 4) total += .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
      setBrightness(Math.round(total / (64 * 36 * 255) * 100));
    }, 500);
    return () => clearInterval(timer);
  }, [streaming]);

  useEffect(() => {
    fetch('/api/copilot').then(r => r.json()).then(d => setConfigured(d.configured === true)).catch(() => {});
    setShowTour(false);
    try {
      setShowTour(false);
      const stored = JSON.parse(localStorage.getItem('cinemind-v2-brief') || 'null');
      if (validBrief(stored)) setBrief(stored);
    } catch { /* Storage may be disabled. */ }
    return () => { cameraGeneration.current++; stream.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (stage === 0) return;
    const heading = document.getElementById(stage === 1 ? 'shots-title' : stage === 3 ? 'footage-title' : 'frame-title');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [stage]);

  function changeBrief(value: SceneBrief) {
    if (value.scene !== brief.scene || value.intention !== brief.intention || value.constraints !== brief.constraints || value.format !== brief.format) {
      setLooks([]); value = { ...value, look: undefined };
    }
    stopCamera(); setStage(0); setBrief(value); setPlan(null); setSelectedTraits([]); setChosen(null); setReview(null); setSaved(false); setError('');
  }
  function stopCamera() {
    live.stop();
    cameraGeneration.current++;
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
    setStreaming(false); setStarting(false);
  }
  async function startCamera(deviceId = selectedDevice) {
    stopCamera(); setInspectSnapshot(false); setSelectedIssue(null);
    const generation = ++cameraGeneration.current;
    setError(''); setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires localhost or HTTPS. You can upload a frame instead.');
      const next = await navigator.mediaDevices.getUserMedia({ video: { ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } }), width: { ideal: brief.format === 'reel' ? 720 : 1280 }, height: { ideal: brief.format === 'reel' ? 1280 : 720 } }, audio: false });
      if (generation !== cameraGeneration.current) { next.getTracks().forEach(t => t.stop()); return; }
      stream.current = next;
      if (video.current) { video.current.srcObject = next; await video.current.play(); }
      if (generation !== cameraGeneration.current) { next.getTracks().forEach(t => t.stop()); return; }
      setFrameSize({ width: video.current?.videoWidth || 16, height: video.current?.videoHeight || 9 });
      const availableDevices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
      if (generation !== cameraGeneration.current) { next.getTracks().forEach(t => t.stop()); return; }
      setDevices(availableDevices);
      setSelectedDevice(next.getVideoTracks()[0]?.getSettings().deviceId || deviceId);
      setStreaming(true);
    } catch (e) { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setError(e instanceof Error && e.message.includes('requires') ? e.message : 'Camera unavailable. Allow camera access in your browser or upload a frame.'); }
    finally { if (generation === cameraGeneration.current) setStarting(false); }
  }
  async function request(action: string, extra = {}) {
    const response = await fetch('/api/copilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, brief, ...extra }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
    return data;
  }
  async function exploreLooks() {
    setBusy('looks'); setError('');
    try {
      if (mode === 'rehearsal') setLooks(rehearsalLooks);
      else { const data = await request('looks'); setLooks(data.looks); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to explore palettes.'); }
    finally { setBusy(null); }
  }
  async function makePlan() {
    live.stop(); setSelectedTraits([]); setBusy('plan'); setError(''); setReview(null); setChosen(null);
    try {
      if (mode === 'rehearsal') setPlan({ brief: { ...brief }, shots: rehearsalShotsFor(brief.format), source: mode });
      else { const data = await request('plan', { referenceFrames: referenceFrames.map(f => f.image) }); setPlan({ brief: { ...brief }, shots: data.shots, source: 'meta', model: data.model, referenceStudy: data.referenceStudy, referencePassages: data.referencePassages }); }
      setStage(1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to plan shots.'); }
    finally { setBusy(null); }
  }
  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2_000_000) { setError('Choose a JPEG, PNG, or WebP under 2 MB.'); return; }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      setImage(canvas.toDataURL('image/jpeg', .85)); setReview(null); setSelectedIssue(null); setInspectSnapshot(false); stopCamera();
    } catch { setError('This image could not be opened. Try a different file.'); }
  }
  function capture() {
    if (!video.current?.videoWidth) { setError('Wait for the camera to finish starting.'); return; }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / video.current.videoWidth);
    canvas.width = Math.round(video.current.videoWidth * scale); canvas.height = Math.round(video.current.videoHeight * scale);
    canvas.getContext('2d')!.drawImage(video.current, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL('image/jpeg', .85)); setReview(null); setSelectedIssue(null); setInspectSnapshot(false); stopCamera();
  }
  async function checkFrame() {
    if (!chosen || !image) return;
    live.stop(); setBusy('review'); setError(''); setReview(null);
    try {
      if (mode === 'rehearsal') setReview({ result: rehearsalReview, source: mode });
      else { const data = await request('review', { shot: chosen, image }); setReview({ result: data.review, source: 'meta', model: data.model }); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to review frame.'); }
    finally { setBusy(null); }
  }
  function toggleReferenceTrait(id: string, checked: boolean) {
    const ids = checked ? Array.from(new Set([...selectedTraits, id])) : selectedTraits.filter(value => value !== id);
    setSelectedTraits(ids);
    if (chosen && plan?.referenceStudy) setChosen({ ...chosen, referenceTraits: plan.referenceStudy.traits.filter(t => ids.includes(t.id)).map(t => `${t.technique}: ${t.adaptation} (${t.basis})`) });
  }
  function locateIssue(category: string) { setSelectedIssue(category); setShowCallouts(true); if (live.analyzedFrame && (streaming || !review)) setInspectSnapshot(true); monitor.current?.scrollIntoView({ block: 'center', behavior: 'instant' }); }
  const inspecting = inspectSnapshot && !!live.analyzedFrame;
  const visibleReview = inspecting ? live.cue : !streaming ? review?.result : null;
  const panelReview = streaming || inspecting ? live.cue : review?.result;
  const annotatedImageSize = inspecting ? live.analyzedSize : stillSize;
  const selectedCheck = visibleReview?.checklist?.find(c => c.category === selectedIssue);
  function exportNotes() {
    const notes = ['CINEMIND / DIRECTOR’S NOTES', `Format: ${brief.format === 'reel' ? 'Reels & shorts' : 'Film & scenes'}`, brief.look ? `CHOSEN LOOK: ${brief.look.name}\n${brief.look.interpretation}\n${brief.look.colors.map(c => `${c.hex}: ${c.role}`).join('\n')}\nLight: ${brief.look.lighting}\nStyling: ${brief.look.styling}\nGrade: ${brief.look.grading}\nTradeoff: ${brief.look.tradeoff}` : 'No palette selected.', `Scene: ${brief.scene}`, `Intention: ${brief.intention}`, `Constraints: ${brief.constraints || 'None specified'}`, brief.reference ? `Reference: ${brief.reference.director || 'User reference'}\nGoal: ${brief.reference.goal}\nLink (not fetched): ${brief.reference.link}\nNotes: ${brief.reference.notes}` : '', plan?.referenceStudy ? `REFERENCE STUDY\n${plan.referenceStudy.summary}\n${plan.referenceStudy.traits.map(t => `${selectedTraits.includes(t.id) ? '[selected]' : '[not selected]'} ${t.technique}: ${t.adaptation} (${t.basis})`).join('\n')}` : '', `Shot options: ${plan?.source === 'meta' ? plan.model : 'Static rehearsal exercises; not AI generated'}`, chosen ? Object.entries(chosen).filter(([k]) => k !== 'id').map(([k,v]) => `${k}: ${v}`).join('\n') : 'No shot chosen.', live.cue ? `LATEST LIVE SNAPSHOT GUIDANCE (${live.updatedAt?.toISOString()})\n${live.cue.suggestions.map(s => `${s.action} — ${s.reason}`).join('\n')}\n${live.cue.uncertainty}\n${live.cue.checklist?.map(c => `${c.category}: ${c.status} — ${c.evidence}`).join('\n') || ''}` : '', review ? `FRAME REVIEW (${review.source === 'meta' ? review.model : 'Rehearsal checklist; frame not analyzed'})\n${review.result.observation}\n${review.result.alignment}\n${review.result.suggestions.map(s => `${s.action} — ${s.reason}`).join('\n')}\nLimits: ${review.result.uncertainty}\n${review.result.checklist?.map(c => `${c.category}: ${c.status} — ${c.evidence}`).join('\n') || ''}` : 'No frame review.'].join('\n\n');
    const url = URL.createObjectURL(new Blob([notes], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = 'cinemind-director-notes.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function closeTour(sample = false) {
    try { localStorage.setItem('cinemind-v2-tour-seen', 'true'); } catch { /* Tour still works without storage. */ }
    setShowTour(false);
    if (sample) changeBrief({ ...exampleBrief });
  }
  function enter(path:StudioPath){stopCamera();setEntry(path);setWorkflow(path==='review'?'review':'shoot');setStage(0);setBriefStep(0);setSceneApplied(false);setError('');}
  const workflowStages = entry==='scene'&&!sceneApplied ? [{stage:0,label:'Shape your idea'}] : workflow === 'review' ? [{stage:0,label:'Set the intention'},{stage:3,label:'Review your footage'}] : [{stage:0,label:'Describe your scene'},{stage:1,label:'Explore shots'},{stage:2,label:'Go live'}];
  return <main className={`cine-workspace cine-original-theme cine-studio studio-stage-${stage} ${entry?'studio-in-flow':'studio-at-entrance'}`}>
    <div className="cine-poster-backdrop" aria-hidden="true" />
    <div className="cine-film-edge cine-film-edge-left" aria-hidden="true" />
    <div className="cine-film-edge cine-film-edge-right" aria-hidden="true" />
    <header className="cine-topbar">
      <Link href="/" onClick={e=>{e.preventDefault();if(busy||readingReference)return;stopCamera();setEntry(null);}} className="cine-brand"><Clapperboard size={23} /><span>CineMind <b>2.0</b></span></Link>
      <span className="cine-top-caption">A little guidance. Your entire vision.</span>
      <div className="cine-header-actions"><label className="studio-header-mode"><span>STUDIO MODE</span><select aria-label="Studio mode" value={mode} disabled={!!busy || readingReference} onChange={e => { live.stop(); setMode(e.target.value as Mode); setLooks([]); setReview(null); setError(''); }}><option value="rehearsal">Rehearsal</option><option value="meta" disabled={!configured}>Meta live</option></select></label><button className="cine-text-link" disabled={!!busy || readingReference} onClick={() => setShowTour(true)}><Clapperboard size={15} />Quick tour</button></div>
    </header>
    {!entry?<StudioEntrance onChoose={enter}/>:<div className="cine-shell">
      <div className="studio-flow-header"><button className="cine-text-link" disabled={!!busy||readingReference} onClick={()=>{stopCamera();setEntry(null);}}><ArrowLeft size={15}/>All workflows</button><span>{entry==='scene'?'DEVELOP A SCENE':entry==='review'?'REVIEW FOOTAGE':'LIVE DIRECTION'}</span></div>
      <nav className="cine-steps" style={{gridTemplateColumns:`repeat(${workflowStages.length},minmax(0,1fr))`}} aria-label="Current workflow">{workflowStages.map((item,i)=><button key={item.stage} aria-current={stage===item.stage?'step':undefined} disabled={!!busy||readingReference||(item.stage===1&&!plan)||(item.stage===2&&!chosen)||(item.stage===3&&!validBrief(brief))} onClick={()=>{if(item.stage!==2)stopCamera();setStage(item.stage);}}><span>{String(i+1).padStart(2,'0')}</span>{item.label}{item.stage===0&&stage!==0&&<Check size={14}/>}</button>)}</nav>
      <div className="cine-notice">{mode === 'rehearsal' ? 'Rehearsal: example shot exercises and a self-review checklist. No AI scene or image analysis.' : stage === 3 ? 'Recorded footage: review four timestamped samples from your take. Your full video and audio stay on this device.' : 'Live guidance sends periodic snapshots only when you start it. Your camera stream stays on this device.'}</div>
      {error && <div className="cine-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
      <div className="cine-layout cine-focused-layout">
        <section hidden={stage !== 0} className="cine-brief cine-panel" aria-labelledby="brief-title"><div className="cine-section-label"><span>01 / INTENTION</span><Film size={17} /></div><h2 id="brief-title">{entry==='scene'&&!sceneApplied?'Let’s find your scene.':['What’s happening?','How should it feel?','Keep it achievable.'][briefStep]}</h2><p className="cine-muted">{entry==='scene'&&!sceneApplied?'A few details from you. A scene you can make your own.':workflow==='review'?'Tell us the scene you wanted. Every note and visual alternative will follow that intention.':'Set the intention. We’ll keep it in view while you shoot.'}</p>
          {entry==='scene'&&!sceneApplied&&<SceneBuilder guided brief={brief} mode={mode} disabled={!!busy} onBusy={setReadingReference} onApply={value=>{changeBrief(value);setSceneApplied(true);setBriefStep(2);}} />}
          <form hidden={entry==='scene'&&!sceneApplied} onSubmit={e => { e.preventDefault(); if(briefStep<2){setBriefStep(briefStep+1);return;} if(workflow==='review'){stopCamera();setStage(3);}else void makePlan(); }}>
            <fieldset hidden={briefStep!==0} className="cine-format-select" disabled={!!busy || readingReference}><legend>What are you shooting?</legend><div>{(['film', 'reel'] as const).map(format => <button type="button" key={format} aria-pressed={(brief.format || 'film') === format} onClick={() => changeBrief({ ...brief, format })}><Film size={18} /><strong>{format === 'film' ? 'Film & scenes' : 'Reels & shorts'}</strong><span>{format === 'film' ? 'Story, coverage, composition' : 'Vertical framing, captions, clarity'}</span></button>)}</div></fieldset>
            <label hidden={briefStep!==0}>The scene or script excerpt<textarea required={briefStep===0} maxLength={4000} value={brief.scene} disabled={!!busy || readingReference} onChange={e => changeBrief({ ...brief, scene: e.target.value })} placeholder="Describe a scene or paste a short script excerpt…" rows={4} /></label>
            <label hidden={briefStep!==1}>What should the audience feel?<textarea required={briefStep===1} maxLength={1000} value={brief.intention} disabled={!!busy || readingReference} onChange={e => changeBrief({ ...brief, intention: e.target.value })} placeholder="Uneasy, intimate, distant? What should stay unsaid?" rows={3} /></label>
            <label hidden={briefStep!==2}>What do you have to work with?<textarea maxLength={1000} value={brief.constraints} disabled={!!busy || readingReference} onChange={e => changeBrief({ ...brief, constraints: e.target.value })} placeholder="Phone camera, one actor, window light…" rows={3} /></label>
            <details hidden={briefStep!==2} className="cine-creative-extras"><summary>{workflow==='review'?'Optional: explore a color direction':'Optional: color & visual influences'}</summary><LookLab selected={brief.look} looks={looks} source={mode} disabled={!!busy || readingReference} pending={busy === 'looks'} ready={validBrief(brief)} onGenerate={() => void exploreLooks()} onSelect={look => changeBrief({ ...brief, look })} />
            {workflow==='shoot'&&<ReferenceInput value={brief.reference} frames={referenceFrames} disabled={!!busy || readingReference} onReading={setReadingReference} onChange={reference => changeBrief({ ...brief, reference })} onFrames={frames => { setReferenceFrames(frames); changeBrief({ ...brief }); }} />}</details>
            <button className="cine-primary" disabled={!!busy || readingReference || (briefStep===0?!brief.scene.trim():briefStep===1?!brief.intention.trim():!validBrief(brief))}>{busy === 'plan' ? <LoaderCircle className="cine-spin" size={17} /> : <Focus size={17} />}{briefStep<2?'Continue':workflow==='review'?'Continue to video':busy === 'plan' ? 'Exploring options…' : mode === 'rehearsal' ? 'Explore shot exercises' : 'Explore shot options'}<ArrowRight size={17} /></button>
            {briefStep>0&&<button type="button" className="cine-text-link brief-back" onClick={()=>setBriefStep(briefStep-1)}><ArrowLeft size={14}/>Previous question</button>}<p className="brief-progress">{briefStep+1} / 3 · YOUR SCENE BRIEF</p>
          </form>
          <div hidden={entry==='scene'&&!sceneApplied} className="cine-brief-actions"><button disabled={!!busy || readingReference} onClick={() => { setReferenceFrames([]); changeBrief({ ...exampleBrief }); }}>Try a sample scene</button><button disabled={!!busy || readingReference || !validBrief(brief)} onClick={() => { try { localStorage.setItem('cinemind-v2-brief', JSON.stringify(brief)); setSaved(true); } catch { setError('Browser storage is unavailable. Export your notes instead.'); } }}>{saved ? 'Brief saved on this device' : 'Save brief locally'}</button></div>
          <p className="cine-footnote">Only a saved brief persists on this device. Frames are never saved by CineMind.</p>
        </section>
        <div hidden={stage === 0} className="cine-main-column">
          {workflow === 'review' && <div hidden={stage !== 3}><FootageWorkspace visible={stage === 3} brief={brief} shot={chosen} mode={mode} onBusy={setReadingReference} /></div>}
          <section hidden={stage !== 1} className="cine-panel" aria-labelledby="shots-title"><div className="cine-section-label"><span>02 / POSSIBILITIES</span><span>{plan ? `${plan.source === 'meta' ? plan.model : 'REHEARSAL'} · 3 OPTIONS` : 'YOUR CHOICE, ALWAYS'}</span></div><h2 id="shots-title" tabIndex={-1}>One scene. Different perspectives.</h2><p className="cine-muted">{brief.format === 'reel' ? 'REELS / Vertical framing, caption room, and clear action. ' : 'FILM / Scene coverage and motivated composition. '}Choose a starting point. Every option is yours to reshape.</p>
            {plan?.referenceStudy && <section className="studio-reference-study"><div><p className="cine-eyebrow">REFERENCE STUDY / CHOOSE WHAT TO BORROW</p><h3>Inspired by a reference. Directed by you.</h3><p>{plan.referenceStudy.summary}</p></div><div className="studio-reference-traits">{plan.referenceStudy.traits.map(trait => <label key={trait.id}><input type="checkbox" checked={selectedTraits.includes(trait.id)} onChange={e => toggleReferenceTrait(trait.id, e.target.checked)} /><span><strong>{trait.technique}</strong><span>{trait.adaptation}</span><small>{trait.basis}</small></span></label>)}</div><p className="cine-footnote">Choose the traits you want the live assistant to follow. Unselected traits won’t be treated as requirements.</p>{!!plan.referencePassages?.length && <details><summary>Reference notes used</summary>{plan.referencePassages.map(p => <blockquote key={p.id}><small>{p.source} · {p.id}</small><p>{p.text}</p></blockquote>)}</details>}</section>}
            {!plan ? <div className="cine-empty"><div className="cine-frame-symbol"><span /></div><p>Your intention comes first.</p><small>Describe your scene to explore three ways of framing it.</small></div> : <div className="cine-shots">{plan.shots.map((shot, i) => <article key={shot.id} className={`cine-shot ${chosen?.id === shot.id ? 'is-selected' : ''}`}><div className={`cine-shot-sketch sketch-${i}`} aria-hidden="true"><span className="cine-subject" /><span className="cine-sketch-label">{`SHOT STUDY / 0${i + 1}`}</span><b>0{i+1}</b></div><div className="cine-shot-body"><h3>{shot.title}</h3><p>{shot.framing}</p><details className="cine-shot-details"><summary>Technique & tradeoffs</summary><dl><dt>Movement</dt><dd>{shot.movement}</dd><dt>Light</dt><dd>{shot.lighting}</dd><dt>Why explore it</dt><dd>{shot.rationale}</dd><dt>The tradeoff</dt><dd>{shot.tradeoff}</dd></dl></details><ShotVisualization brief={brief} shot={{ ...shot, referenceTraits: plan.referenceStudy?.traits.filter(t => selectedTraits.includes(t.id)).map(t => `${t.technique}: ${t.adaptation}`) || [] }} mode={mode} /><button className={chosen?.id === shot.id ? 'cine-primary' : 'cine-secondary'} disabled={!!busy || readingReference} onClick={() => { setChosen({ ...shot, referenceTraits: plan.referenceStudy?.traits.filter(t => selectedTraits.includes(t.id)).map(t => `${t.technique}: ${t.adaptation} (${t.basis})`) || [] }); setReview(null); setSelectedIssue(null); setInspectSnapshot(false); setStage(2); }}>{chosen?.id === shot.id ? <><Check size={15} />Chosen starting point</> : <>Explore this shot<ArrowRight size={15} /></>}</button></div></article>)}</div>}
          </section>
          <section hidden={stage !== 2} className="cine-live-stage" ref={reviewSection} aria-labelledby="frame-title">
            <div className="studio-stage-heading"><div><p className="cine-eyebrow">ON SET / SCENE 01</p><h2 id="frame-title" tabIndex={-1}>Stay in the moment.</h2></div><span className={`studio-live-pill ${streaming ? 'is-live' : ''}`}><i />{streaming ? 'CAMERA LIVE' : 'CAMERA STANDBY'}</span></div>
            <div className="studio-live-layout">
              <div className="studio-viewfinder-column">
                {(streaming || live.analyzedFrame) && <div className="studio-monitor-tabs" aria-label="Monitor view"><button disabled={!streaming} aria-pressed={!inspecting} onClick={() => setInspectSnapshot(false)}>Live camera</button><button disabled={!live.analyzedFrame} aria-pressed={inspecting} onClick={() => setInspectSnapshot(true)}>Inspect analyzed snapshot</button></div>}
                <div className="studio-format-label">{brief.format === 'reel' ? 'REELS / VERTICAL STUDY' : 'FILM / SCENE STUDY'}{brief.format === 'reel' && <span>Keep key details clear of app controls; overlays vary.</span>}</div>
                <div className="studio-monitor-top"><span><Focus size={14} /> DIRECTOR’S MONITOR</span><span>{inspecting ? `ANALYZED ${live.capturedAt?.toLocaleTimeString()}` : streaming ? 'LOCAL FEED' : image ? 'STILL FRAME' : 'READY WHEN YOU ARE'}</span></div>
                <div className="cine-monitor studio-monitor" ref={monitor} style={{ aspectRatio: streaming ? `${frameSize.width}/${frameSize.height}` : brief.format === 'reel' ? '9/16' : '16/9' }}>
                  <video ref={video} muted autoPlay playsInline hidden={!streaming || inspecting} onLoadedMetadata={e => setFrameSize({ width: e.currentTarget.videoWidth || 16, height: e.currentTarget.videoHeight || 9 })} />
                  {((image && !streaming) || inspecting) && <img src={inspecting ? live.analyzedFrame : image} alt={inspecting ? 'The exact camera snapshot analyzed by Meta' : 'Your captured frame for review'} onLoad={e => { if (!inspecting) setStillSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight }); }} />}
                  {showCallouts && visibleReview && <FrameAnnotations checks={visibleReview.checklist} mediaWidth={annotatedImageSize.width} mediaHeight={annotatedImageSize.height} selected={selectedIssue} onSelect={locateIssue} />}
                  {!streaming && !image && !inspecting && <div className="studio-monitor-empty"><div className="studio-reticle"><Focus size={38} strokeWidth={.8} /></div><p>Find your light.</p><span>Open your camera. Let the scene unfold.</span><button className="cine-primary" disabled={!chosen || !!busy || starting} onClick={() => void startCamera()}><Camera size={16} />{starting ? 'Connecting…' : 'Open camera'}</button><small>Phone, webcam, or a camera your browser recognizes.</small></div>}
                  {grid && (streaming || image) && <div className="cine-grid" aria-hidden="true"><i /><i /><i /><i /></div>}
                  {streaming && <><div className="studio-monitor-corner top-left" /><div className="studio-monitor-corner top-right" /><div className="studio-monitor-corner bottom-left" /><div className="studio-monitor-corner bottom-right" /><span className="studio-feed-label"><i />{frameSize.width} × {frameSize.height}</span></>}
                  {streaming && !inspecting && live.cue && <div className="studio-cue-overlay"><span>SHOT REPORT</span><button className="studio-inspect-report" onClick={() => setInspectSnapshot(true)}>{live.cue.checklist?.filter(c => c.status === 'attention').length || 0} checks to revisit · inspect this snapshot ↗</button><small>Snapshot at {live.capturedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · optional direction</small></div>}
                </div>
                <div className="studio-monitor-bottom"><span>{brightness === null ? 'EXPOSURE / —' : `FRAME BRIGHTNESS / ${brightness}%`}</span><label><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} />Thirds guide</label><span>{live.active ? 'AI GUIDANCE ON' : 'AI GUIDANCE OFF'}</span></div>
                {visibleReview && <div className="studio-annotation-caption"><label><input type="checkbox" checked={showCallouts} onChange={e => setShowCallouts(e.target.checked)} />Show visual callouts</label><span>Approximate locations on this snapshot · not tracking</span></div>}
                {selectedCheck && <div className="studio-selected-issue"><span>{selectedCheck.region?.label || selectedCheck.category}</span><p>{selectedCheck.evidence}</p><strong>{selectedCheck.action}</strong></div>}
                {inspecting && <p className="cine-footnote">Captured at {live.capturedAt?.toLocaleTimeString()}. Callouts belong to this frozen snapshot. {streaming ? 'The live camera is still running.' : 'The camera is stopped.'}</p>}
                <div className="studio-camera-toolbar">
                  {streaming ? <><button className="cine-secondary" disabled={!!busy || readingReference} onClick={capture}><Camera size={15} />Capture still</button><button className="cine-text-link" onClick={stopCamera}>Stop camera</button></> : image ? <button className="cine-secondary" disabled={!!busy || starting} onClick={() => void startCamera()}><Camera size={15} />Return to camera</button> : null}
                  <label className={`cine-secondary cine-upload ${!chosen || busy ? 'is-disabled' : ''}`}><Upload size={15} />Upload still<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!chosen || !!busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
                  {image && !streaming && <button className="cine-text-link" disabled={!!busy || readingReference} onClick={() => { setImage(''); setReview(null); }}>Clear</button>}
                  {devices.length > 1 && <label className="studio-device-select">Camera<select aria-label="Camera device" value={selectedDevice} disabled={starting || !!busy} onChange={e => { setSelectedDevice(e.target.value); if (streaming) void startCamera(e.target.value); }}>{devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}</select></label>}
                </div>
                {image && !streaming && <button className="cine-primary studio-still-review" disabled={!chosen || !validShot(chosen) || !!busy} onClick={checkFrame}>{busy === 'review' ? <LoaderCircle size={16} className="cine-spin" /> : <Focus size={16} />}{busy === 'review' ? 'Looking at your frame…' : mode === 'meta' ? 'Review this still' : 'Open self-review checklist'}</button>}
                {((image && !streaming) || inspecting) && <SubjectStudy image={inspecting ? live.analyzedFrame : image} brief={brief} shot={chosen} mode={mode} onStart={() => live.stop()} />}
                <p className="cine-footnote">Brightness is a local pixel average, not a light-meter reading. Still uploads: JPEG, PNG or WebP, up to 2 MB.</p>
              </div>
              <aside className="studio-direction-panel">
                <div className="studio-assistant-title"><span className="studio-assistant-mark"><Clapperboard size={19} /></span><div><h3>Beside the lens</h3><p>Your live filmmaking copilot</p></div>{live.pending && <LoaderCircle size={17} className="cine-spin" />}</div>
                {!!chosen?.referenceTraits?.length && <details className="studio-selected-reference"><summary>Reference traits in play · {chosen.referenceTraits.length}</summary>{chosen.referenceTraits.map((trait, i) => <p key={i}>{trait}</p>)}{!!referenceFrames.length && <div className="studio-reference-thumbnails">{referenceFrames.map((frame, i) => <figure key={i}><img src={frame.image} alt={`Your reference frame ${i + 1}`} /><figcaption>{frame.label}</figcaption></figure>)}</div>}</details>}
                {brief.look && <section className="studio-chosen-look"><h4>CHOSEN LOOK / {brief.look.name}</h4><LookSwatches look={brief.look} /><details><summary>Setup & grading</summary><p>{brief.look.interpretation}</p><dl><dt>Light</dt><dd>{brief.look.lighting}</dd><dt>Wardrobe & surroundings</dt><dd>{brief.look.styling}</dd><dt>Optional grade</dt><dd>{brief.look.grading}</dd></dl></details><small>Visual target · camera colors remain unchanged</small></section>}
                <div className="studio-intention"><span>THE FEELING WE’RE FOLLOWING</span><p>“{brief.intention}”</p></div>
                <div className="studio-direction-content" aria-live="polite"><p className="cine-eyebrow">{live.pending ? 'TAKING A LOOK' : panelReview ? 'YOUR SHOT REPORT' : 'YOUR NEXT MOVE IS YOURS'}</p><h3>{live.pending && !panelReview ? 'Reading the scene…' : panelReview ? `${panelReview.checklist?.filter(c => c.status === 'attention').length || 0} checks to revisit.` : 'A second set of eyes on every detail.'}</h3><p>{panelReview ? 'All identified concerns are included below. Keep the choices that serve your shot.' : 'Start your camera, then enable live guidance. You’ll get a full shot report covering the subject, composition, background, light, clarity, and scene intention.'}</p>
                  {panelReview && <details className="studio-cue-context"><summary>What the camera shows</summary><p>{panelReview.observation}</p><p>{panelReview.alignment}</p><small>{panelReview.uncertainty}</small></details>}
                </div>
                <ShotChecklist checks={panelReview?.checklist} selected={selectedIssue} onLocate={locateIssue} />
                <div className="studio-guidance-controls"><button className={live.active ? 'cine-secondary' : 'cine-primary'} disabled={!streaming || mode !== 'meta' || !!busy || !chosen || !validShot(chosen)} onClick={live.active ? () => live.stop() : live.start}>{live.active ? <><X size={15} />Pause guidance</> : <><Focus size={15} />Start live guidance</>}</button><div className="studio-session-count"><span>{live.active ? 'GUIDANCE ACTIVE' : 'GUIDANCE PAUSED'}</span><span>{live.count} / {LIVE_REQUEST_LIMIT} snapshots</span></div><p>{mode !== 'meta' ? 'Choose Meta live in the top bar to enable AI guidance. Rehearsal makes no AI calls.' : live.status}</p><small>A snapshot is sent after you start, then 12 seconds after each reply. Replies take additional time. Stops after 8 requests or when this tab is hidden. No audio or video stream is sent.</small></div>
                {chosen && <details className="studio-shot-brief"><summary>Shot intention <span>{chosen.title}</span></summary><p className="cine-footnote">Editing this shot pauses live guidance.</p><label>Your framing<textarea maxLength={2000} rows={3} disabled={!!busy || readingReference} value={chosen.framing} onChange={e => { setChosen({ ...chosen, framing: e.target.value }); setReview(null); }} /></label><p><strong>Movement</strong>{chosen.movement}</p><p><strong>Light</strong>{chosen.lighting}</p></details>}
              </aside>
            </div>

          </section>
          <footer hidden={stage === 3} className="cine-workspace-footer"><p><span>CineMind is your copilot.</span> You are the filmmaker.</p><button className="cine-secondary" disabled={!plan} onClick={exportNotes}><Download size={16} />Export notes</button></footer>
        </div>
      </div>
    </div>}
    {showTour && <CopilotTutorial onClose={closeTour} />}
  </main>;
}
