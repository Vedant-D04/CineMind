'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Clapperboard, Focus, X } from 'lucide-react';

const steps = [
  { eyebrow: 'WELCOME TO CINEMIND', title: 'Your vision. Your director’s chair.', description: 'A filmmaking copilot that helps you explore technique without taking over your creative decisions. Here’s how a scene becomes a shot.', icon: Clapperboard },
  { eyebrow: '01 / DESCRIBE', title: 'Start with your intention.', description: 'Choose Develop a scene, Review footage or Live direction. Answer one short question at a time. Describe your scene, intended feeling and available resources. These guide every suggestion.', icon: Clapperboard },
  { eyebrow: '02 / EXPLORE', title: 'Explore what serves the scene.', description: 'Recorded footage gets detailed director’s notes with experiments and tradeoffs. Visualize an alternative from your exact frame. In Live direction, compare three shot options and optional previews. You choose what to keep.', icon: Focus },
  { eyebrow: '03 / GO LIVE', title: 'Live or already recorded.', description: 'Open your camera for periodic guidance, or review four samples from recorded footage. On a frozen frame, Subject study uses SAM 3.1 masks and Muse Spark for composition guidance.', icon: Camera },
];
export default function CopilotTutorial({ onClose }: { onClose: (sample?: boolean) => void }) {
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = steps[step];
  const Icon = current.icon;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [step]);
  return <dialog ref={dialog} className="cine-tour" aria-labelledby="cine-tour-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <button className="cine-tour-close" aria-label="Close tutorial" onClick={() => onClose()}><X size={20} /></button>
    <div className="cine-tour-visual" aria-hidden="true"><div className="cine-tour-reel"><Icon size={44} strokeWidth={1.2} /></div><span>CINEMIND / TAKE {String(step + 1).padStart(2, '0')}</span></div>
    <div className="cine-tour-content"><p className="cine-eyebrow">{current.eyebrow}</p><h2 ref={heading} tabIndex={-1} id="cine-tour-title">{current.title}</h2><p className="cine-tour-description">{current.description}</p>
      <div className="cine-tour-progress" aria-label={`Tutorial step ${step + 1} of ${steps.length}`}>{steps.map((s, i) => <span key={s.eyebrow} className={i <= step ? 'is-active' : ''} />)}<small>{step + 1} / {steps.length}</small></div>
      {step === steps.length - 1 && <p className="cine-tour-mode">Start in rehearsal mode: fixed shot exercises and a self-review checklist. Live AI is available when Meta access is connected.</p>}
      <div className="cine-tour-actions">{step > 0 ? <button className="cine-text-link" onClick={() => setStep(step - 1)}><ArrowLeft size={14} />Back</button> : <button className="cine-text-link" onClick={() => onClose()}>Skip tour</button>}{step < steps.length - 1 ? <button className="cine-primary" onClick={() => setStep(step + 1)}>Next<ArrowRight size={16} /></button> : <button className="cine-primary" onClick={() => onClose()}>Start my scene<ArrowRight size={16} /></button>}</div>
      {step === steps.length - 1 && <button className="cine-tour-sample" onClick={() => onClose(true)}>Or try it with a sample scene</button>}
    </div>
  </dialog>;
}
