export interface SubjectMask {
  id: string;
  bounds: { left: number; top: number; right: number; bottom: number };
  path: string; maskWidth: number; maskHeight: number;
  coverage: number; center: { x: number; y: number };
}
export interface SubjectSegmentation { model: 'sam-3.1'; prompt: string; width: number; height: number; subjects: SubjectMask[] }
export interface CompositionStudy { observation: string; options: { action: string; reason: string }[]; uncertainty: string }
export const validCompositionStudy = (v: unknown): v is CompositionStudy => {
  if (!v || typeof v !== 'object') return false;
  const s = v as CompositionStudy;
  return [s.observation, s.uncertainty].every(t => typeof t === 'string' && !!t.trim() && t.length <= 1200) && Array.isArray(s.options) && s.options.length <= 6 && s.options.every(o => o && [o.action,o.reason].every(t => typeof t === 'string' && !!t.trim() && t.length <= 600));
};
export function subjectMeasurements(segmentation: SubjectSegmentation) {
  const { width, height } = segmentation;
  return segmentation.subjects.map(s => ({ id: s.id, frameCoverage: s.coverage, center: s.center, margins: { left: s.bounds.left / width, top: s.bounds.top / height, right: (width - s.bounds.right) / width, bottom: (height - s.bounds.bottom) / height } }));
}
