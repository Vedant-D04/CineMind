'use client';
import { useRef, useState } from 'react';
import { Film, Upload, X } from 'lucide-react';
import type { ReferenceBrief } from '@/lib/cinemind';
export interface ReferenceFrame { image: string; label: string }
const blank: ReferenceBrief = { director: '', goal: 'inspired', notes: '', link: '' };
function waitFor(video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked') {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('This clip took too long to read. Try an MP4 encoded for browser playback.')), 10000);
    const success = () => finish(); const error = () => finish(new Error('This video cannot be read by this browser. Try an MP4 or upload a still.'));
    function finish(reason?: Error) { clearTimeout(timer); video.removeEventListener(event, success); video.removeEventListener('error', error); reason ? reject(reason) : resolve(); }
    video.addEventListener(event, success, { once: true }); video.addEventListener('error', error, { once: true });
  });
}
export default function ReferenceInput({ value, frames, disabled, onChange, onFrames, onReading }: { value?: ReferenceBrief; frames: ReferenceFrame[]; disabled: boolean; onChange: (value: ReferenceBrief) => void; onFrames: (frames: ReferenceFrame[]) => void; onReading: (busy: boolean) => void }) {
  const reference = value || blank;
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const generation = useRef(0);
  const patch = (next: Partial<ReferenceBrief>) => onChange({ ...reference, ...next });
  async function upload(file?: File) {
    if (!file) return;
    const run = ++generation.current; setError(''); setBusy(true); onReading(true);
    let media: HTMLVideoElement | null = null; let url = '';
    try {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use a JPEG, PNG, WebP, or browser-playable video.');
      if (file.size > (isVideo ? 20_000_000 : 5_000_000)) throw new Error(isVideo ? 'Use a reference clip under 20 MB and 30 seconds.' : 'Use a reference image under 5 MB.');
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')!;
      const capture = (source: CanvasImageSource, width: number, height: number) => { const scale = Math.min(1, 640 / Math.max(width, height)); canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale)); ctx.drawImage(source, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', .72); };
      const result: ReferenceFrame[] = [];
      if (!isVideo) { const bitmap = await createImageBitmap(file); try { result.push({ image: capture(bitmap, bitmap.width, bitmap.height), label: file.name }); } finally { bitmap.close(); } }
      else {
        media = document.createElement('video'); media.muted = true; media.preload = 'auto'; media.playsInline = true;
        url = URL.createObjectURL(file); const ready = waitFor(media, 'loadedmetadata'); media.src = url; await ready;
        if (!Number.isFinite(media.duration) || media.duration <= 0 || media.duration > 30) throw new Error('Use a reference clip up to 30 seconds long.');
        for (const fraction of [.05, .5, .9]) {
          const at = Math.min(media.duration - .001, Math.max(.001, media.duration * fraction));
          const seek = waitFor(media, 'seeked'); media.currentTime = at; await seek;
          result.push({ image: capture(media, media.videoWidth, media.videoHeight), label: `${file.name} · ${at.toFixed(1)}s` });
        }
      }
      if (run === generation.current) onFrames(result);
    } catch (e) { if (run === generation.current) setError(e instanceof Error ? e.message : 'Unable to read this reference.'); }
    finally { if (url) URL.revokeObjectURL(url); if (media) { media.removeAttribute('src'); media.load(); } if (run === generation.current) { setBusy(false); onReading(false); } }
  }
  return <details className="studio-reference-input"><summary><Film size={16} /><span>Bring an influence<span>A director, a frame, a shot you keep coming back to.</span></span><small>OPTIONAL</small></summary><div className="studio-reference-fields">
    <div className="studio-reference-row"><label>Director or visual influence<input maxLength={120} disabled={disabled || busy} value={reference.director} onChange={e => patch({ director: e.target.value })} placeholder="A filmmaker or a visual approach…" /></label><label>How do you want to use it?<select disabled={disabled || busy} value={reference.goal} onChange={e => patch({ goal: e.target.value as ReferenceBrief['goal'] })}><option value="inspired">Looser inspiration</option><option value="match">Study a close match</option></select></label></div>
    <label>What do you want to borrow?<textarea maxLength={6000} rows={3} disabled={disabled || busy} value={reference.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Composition, color, light, staging… Paste your reference notes or describe the specific moment." /></label>
    <label>Reference link <span className="studio-field-hint">Attribution only; links are not opened automatically.</span><input type="url" maxLength={2048} disabled={disabled || busy} value={reference.link} onChange={e => patch({ link: e.target.value })} placeholder="https://…" /></label>
    <div className="studio-reference-upload-row"><label className="cine-secondary cine-upload"><Upload size={14} />{busy ? 'Reading reference…' : 'Add a reference still or clip'}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" disabled={disabled || busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>{!!frames.length && <button type="button" className="cine-text-link" disabled={disabled || busy} onClick={() => onFrames([])}><X size={13} />Remove reference media</button>}</div>
    {!!frames.length && <div className="studio-reference-thumbnails">{frames.map((frame, i) => <figure key={i}><img src={frame.image} alt={`Reference frame ${i + 1}`} /><figcaption>{frame.label}</figcaption></figure>)}</div>}
    {error && <p role="alert" className="studio-reference-error">{error}</p>}
    <p className="cine-footnote">Images up to 5 MB. Clips up to 30 seconds / 20 MB are sampled into three stills locally; no audio or full video is sent. Reference frames go to Meta only when you generate shots in Meta mode. Save brief stores text only.</p>
  </div></details>;
}
