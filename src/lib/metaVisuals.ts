import { parseImageStream, recordsOfKind, decodeMaskToRaster, decodeMaskToSVGPath } from '@meta-sam/parser';
import type { SubjectSegmentation } from './visualTypes';

export class VisualAPIError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function metaVisualRequest(path: string, body: unknown, signal?: AbortSignal) {
  const key = process.env.META_API_KEY;
  if (!key) throw new VisualAPIError(503, 'Meta access is not configured.');
  const timeout = AbortSignal.timeout(90_000);
  const response = await fetch(`https://api.meta.ai/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!response.ok) throw new VisualAPIError(response.status === 429 ? 429 : 502, response.status === 401 || response.status === 403 ? 'Meta declined access to this model. Check model access and credits.' : response.status === 429 ? 'Meta rate limit reached. Wait before trying again.' : 'Meta could not complete this visual request.');
  return response;
}
export async function* readResponseEvents(response: Response) {
  if (!response.body) throw new Error('No segmentation stream.');
  const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '', bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength; if (bytes > 16_000_000) throw new Error('Segmentation response exceeded the supported size.');
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0,index).trim(); buffer = buffer.slice(index + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim(); if (!data || data === '[DONE]') continue;
        const event = JSON.parse(data); if (event && typeof event.type === 'string') yield event;
      }
    }
    if (buffer.trim().startsWith('data:')) { const data = buffer.trim().slice(5).trim(); if (data && data !== '[DONE]') yield JSON.parse(data); }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export async function segmentSubject(image: string, prompt: string, width: number, height: number, signal?: AbortSignal): Promise<SubjectSegmentation> {
  const response = await metaVisualRequest('responses', { model: 'sam-3.1', input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: image }] }], stream: true, store: false, metadata: { mask_encoding: 'one_bit' } }, signal);
  const result = await parseImageStream(readResponseEvents(response)).finalResult;
  if (result.outcome.status !== 'completed' || result.diagnostics.some(d => d.severity === 'error')) throw new Error('Segmentation did not return a complete mask result.');
  const subjects: SubjectSegmentation['subjects'] = [];
  const masks = recordsOfKind(result.records, 'mask');
  if (masks.length > 16) throw new Error('Too many matches. Use a more specific subject phrase.');
  for (const record of masks) {
    const b = record.bounds, mask = record.mask;
    if (mask.width * mask.height > 4_000_000 || mask.width <= 0 || mask.height <= 0 || b.left < 0 || b.top < 0 || b.right > width || b.bottom > height || b.right <= b.left || b.bottom <= b.top) throw new Error('The mask dimensions did not match the supplied image.');
    const raster = decodeMaskToRaster(mask); let count = 0, xTotal = 0, yTotal = 0;
    for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) if (raster[y * mask.width + x]) { count++; xTotal += x + .5; yTotal += y + .5; }
    if (!count) continue;
    const path = decodeMaskToSVGPath(mask); if (path.length > 1_000_000) throw new Error('The mask outline is too complex to display.');
    subjects.push({ id: record.objectId, bounds: b, path, maskWidth: mask.width, maskHeight: mask.height, coverage: (count / raster.length) * ((b.right-b.left) * (b.bottom-b.top)) / (width*height), center: { x: (b.left + xTotal / count * (b.right-b.left)/mask.width)/width, y: (b.top + yTotal / count * (b.bottom-b.top)/mask.height)/height } });
  }
  return { model: 'sam-3.1', prompt, width, height, subjects };
}
