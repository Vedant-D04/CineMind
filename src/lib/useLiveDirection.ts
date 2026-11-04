'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { validReview, type FrameReview, type SceneBrief, type Shot } from './cinemind';

export const LIVE_REQUEST_LIMIT = 8;
export const LIVE_INTERVAL_MS = 12_000;
export function useLiveDirection(video: RefObject<HTMLVideoElement | null>, brief: SceneBrief, shot: Shot | null) {
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(0);
  const [analyzedFrame, setAnalyzedFrame] = useState('');
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [analyzedSize, setAnalyzedSize] = useState({ width: 16, height: 9 });
  const [cue, setCue] = useState<FrameReview | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState('Start when you’re ready. You stay in control.');
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const countRef = useRef(0);
  const previousCue = useRef('');
  const stop = useCallback((message = 'Guidance paused. No more snapshots will be sent.') => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    controller.current?.abort();
    setActive(false); setPending(false); setStatus(message);
  }, []);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) stop('Paused because this tab is hidden. Restart when you return.'); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { run.current++; if (timer.current) clearTimeout(timer.current); controller.current?.abort(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [stop]);
  useEffect(() => { stop(); setCue(null); setUpdatedAt(null); setAnalyzedFrame(''); setCapturedAt(null); previousCue.current = ''; }, [brief, shot, stop]);

  const start = useCallback(() => {
    if (!shot || !video.current?.videoWidth || document.hidden) return;
    stop();
    const session = ++run.current;
    countRef.current = 0; setCount(0); setActive(true); setStatus('Watching for your next adjustment…');
    const tick = async () => {
      if (run.current !== session || document.hidden) return;
      if (countRef.current >= LIVE_REQUEST_LIMIT) { stop('Session limit reached. Restart guidance for another 8 snapshots.'); return; }
      const source = video.current;
      if (!source?.videoWidth || source.readyState < 2) { stop('Camera is not ready. Start the camera and try again.'); return; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(960, source.videoWidth);
      canvas.height = Math.round(source.videoHeight * canvas.width / source.videoWidth);
      canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height);
      const snapshot = canvas.toDataURL('image/jpeg', .72);
      const snapshotAt = new Date();
      controller.current = new AbortController();
      setPending(true); countRef.current++; setCount(countRef.current);
      try {
        const response = await fetch('/api/copilot', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.current.signal,
          body: JSON.stringify({ action: 'live', brief, shot, image: snapshot, previousGuidance: previousCue.current }),
        });
        const data = await response.json();
        if (run.current !== session) return;
        if (!response.ok || !validReview(data.review)) throw new Error(data.error || 'No complete guidance returned.');
        setAnalyzedFrame(snapshot); setCapturedAt(snapshotAt); setAnalyzedSize({ width: canvas.width, height: canvas.height });
        setCue(data.review); setUpdatedAt(new Date());
        previousCue.current = data.review.suggestions.map((s: { action: string }) => s.action).join(' ').slice(0, 1000);
        setPending(false); setStatus('Full shot report updated. Another look in 12 seconds.');
        if (countRef.current >= LIVE_REQUEST_LIMIT) stop('8 snapshots reviewed. Restart guidance when you want another pass.');
        else timer.current = setTimeout(tick, LIVE_INTERVAL_MS);
      } catch (error) {
        if (run.current === session) stop(error instanceof Error ? error.message : 'Connection interrupted. Restart guidance to retry.');
      }
    };
    void tick();
  }, [brief, shot, video, stop]);
  return { active, pending, count, analyzedFrame, capturedAt, analyzedSize, cue, updatedAt, status, start, stop };
}
