import { footageSampleTimes, type FootageFrame } from './cinemind';
function waitFor(video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked', signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const success = () => finish();
    const error = () => finish(new Error('This video cannot be decoded. Try a browser-playable MP4 or WebM.'));
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Video reading timed out. Try a smaller MP4 or WebM.')), 12000);
    function finish(reason?: Error) { clearTimeout(timer); video.removeEventListener(event, success); video.removeEventListener('error', error); signal.removeEventListener('abort', abort); reason ? reject(reason) : resolve(); }
    video.addEventListener(event, success, { once: true }); video.addEventListener('error', error, { once: true }); signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}
export async function sampleFootage(file: File, signal: AbortSignal) {
  if (!file.type.startsWith('video/')) throw new Error('Choose a browser-playable video file, such as MP4 or WebM.');
  if (file.size > 100_000_000) throw new Error('Choose footage under 100 MB and up to 60 seconds. Trim a longer recording first.');
  const video = document.createElement('video'); video.muted = true; video.preload = 'auto'; video.playsInline = true;
  const url = URL.createObjectURL(file);
  try {
    const ready = waitFor(video, 'loadedmetadata', signal); video.src = url; await ready;
    const duration = video.duration, times = footageSampleTimes(duration);
    if (!times.length) throw new Error('Choose a clip up to 60 seconds long. Trim a longer recording first.');
    if (!video.videoWidth || !video.videoHeight) throw new Error('No readable video track was found.');
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(video.videoWidth * scale)); canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d'); if (!context) throw new Error('This browser cannot prepare video frames.');
    const frames: FootageFrame[] = [];
    for (const time of times) {
      const seeking = waitFor(video, 'seeked', signal); video.currentTime = time; await seeking;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({ time, image: canvas.toDataURL('image/jpeg', .72) });
    }
    return { duration, frames, width: canvas.width, height: canvas.height };
  } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
}
