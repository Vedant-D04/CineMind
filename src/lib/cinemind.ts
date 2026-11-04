export interface ReferenceBrief {
  director: string;
  goal: 'inspired' | 'match';
  notes: string;
  link: string;
}
export interface ReferenceStudy {
  summary: string;
  traits: { id: string; technique: string; adaptation: string; basis: string }[];
}
export interface FrameRegion {
  x: number; y: number; width: number; height: number;
  label: string; confidence: number;
}
export interface ColorLook {
  id: string;
  name: string;
  interpretation: string;
  colors: { hex: string; role: string }[];
  lighting: string;
  styling: string;
  grading: string;
  tradeoff: string;
}
export interface SceneBrief {
  visualPrompt?: string;
  format?: 'film' | 'reel';
  look?: ColorLook;
  reference?: ReferenceBrief;
  scene: string;
  intention: string;
  constraints: string;
}
export interface Shot {
  referenceTraits?: string[];
  id: string;
  title: string;
  framing: string;
  movement: string;
  lighting: string;
  rationale: string;
  tradeoff: string;
}
export const SHOT_CHECKS = [
  { id: 'subject', label: 'Subject visibility', description: 'Expected subject, face, hands and important props; unintended cropping or obstruction.' },
  { id: 'image_quality', label: 'Image clarity', description: 'Visible blur, lost detail and whether the subject can be read in this snapshot.' },
  { id: 'composition', label: 'Composition', description: 'Shot size, headroom, looking room, camera angle, eyeline and balance.' },
  { id: 'background', label: 'Background & edges', description: 'Distractions, competing subjects, awkward overlaps and frame edges.' },
  { id: 'lighting', label: 'Light & exposure', description: 'Subject visibility, contrast, bright areas and the intended light quality.' },
  { id: 'story', label: 'Scene & intention', description: 'Intended action, setting, props and visual support for the desired feeling.' },
] as const;
export interface ShotCheck {
  region?: FrameRegion | null;
  category: typeof SHOT_CHECKS[number]['id'];
  status: 'attention' | 'clear' | 'uncertain' | 'not_applicable';
  evidence: string;
  action: string;
  reason: string;
}
export interface DirectorExploration {
  id: string; title: string; observation: string; experiment: string;
  factors?: ('composition' | 'lighting' | 'color' | 'background')[];
  effect: string; tradeoff: string; feasibility: 'edit' | 'reshoot' | 'either';
}
export interface DirectorNotes {
  reading: string; strength: string; explorations: DirectorExploration[]; question: string;
}
export interface FrameReview {
  director?: DirectorNotes;
  checklist?: ShotCheck[];
  observation: string;
  alignment: string;
  suggestions: { action: string; reason: string }[];
  uncertainty: string;
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 2000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export function validBrief(v: unknown): v is SceneBrief {
  return record(v) && (v.visualPrompt === undefined || text(v.visualPrompt, 1800)) && text(v.scene, 4000) && text(v.intention, 1000) && typeof v.constraints === 'string' && v.constraints.length <= 1000 && (v.reference === undefined || validReference(v.reference)) && (v.format === undefined || ['film', 'reel'].includes(v.format as string)) && (v.look === undefined || validColorLook(v.look));
}
export function validShot(v: unknown): v is Shot {
  return record(v) && ['id', 'title', 'framing', 'movement', 'lighting', 'rationale', 'tradeoff'].every(k => text(v[k])) && (v.referenceTraits === undefined || (Array.isArray(v.referenceTraits) && v.referenceTraits.length <= 6 && v.referenceTraits.every(t => text(t, 500))));
}
export function validPlan(v: unknown): v is { shots: Shot[] } {
  return record(v) && Array.isArray(v.shots) && v.shots.length === 3 && v.shots.every(validShot) && new Set(v.shots.map(s => s.id)).size === 3;
}
export function validReview(v: unknown): v is FrameReview {
  return record(v) && ['observation', 'alignment', 'uncertainty'].every(k => text(v[k])) && Array.isArray(v.suggestions) && v.suggestions.length >= 1 && v.suggestions.length <= 6 && v.suggestions.every(s => record(s) && text(s.action) && text(s.reason)) && (v.checklist === undefined || validChecklist(v.checklist));
}
export function validChecklist(value: unknown): value is ShotCheck[] {
  if (!Array.isArray(value) || value.length !== SHOT_CHECKS.length) return false;
  return SHOT_CHECKS.every(({ id }) => value.filter(c => record(c) && c.category === id).length === 1) && value.every(c =>
    record(c) && ['attention', 'clear', 'uncertain', 'not_applicable'].includes(c.status as string) && text(c.evidence, 600) &&
    typeof c.action === 'string' && c.action.length <= 400 && typeof c.reason === 'string' && c.reason.length <= 600 &&
    (c.status !== 'attention' || (text(c.action, 400) && text(c.reason, 600))) && (c.region == null || validRegion(c.region))
  );
}
export type ShotAssessment = Omit<FrameReview, 'suggestions'> & { checklist: ShotCheck[] };
export function validAssessedReview(value: unknown): value is ShotAssessment {
  return record(value) && ['observation', 'alignment', 'uncertainty'].every(k => text(value[k])) && validChecklist(value.checklist) && (value.director === undefined || validDirectorNotes(value.director));
}
// Report every applicable concern; do not suppress issues to select a single cue.
export function reviewFromChecklist(review: ShotAssessment): FrameReview {
  const ordered = SHOT_CHECKS.map(({ id }) => review.checklist.find(c => c.category === id)!);
  const attention = ordered.filter(c => c.status === 'attention');
  let suggestions: FrameReview['suggestions'];
  if (attention.length) suggestions = attention.map(({ action, reason }) => ({ action, reason }));
  else if (ordered.some(c => c.status === 'uncertain')) suggestions = [{ action: 'Hold the shot while you check the uncertain details below.', reason: 'This snapshot does not provide enough evidence to recommend a specific adjustment.' }];
  else suggestions = [{ action: 'Consider holding this frame.', reason: 'No actionable mismatch was identified in the shot checklist; keep what serves your intention.' }];
  return { ...review, checklist: ordered, suggestions };
}
export function validReference(v: unknown): v is ReferenceBrief {
  if (!record(v) || typeof v.director !== 'string' || v.director.length > 120 || !['inspired', 'match'].includes(v.goal as string) || typeof v.notes !== 'string' || v.notes.length > 6000 || typeof v.link !== 'string' || v.link.length > 2048) return false;
  if (!v.link) return true;
  try { return ['https:', 'http:'].includes(new URL(v.link).protocol); } catch { return false; }
}
export function validReferenceStudy(v: unknown): v is ReferenceStudy {
  return record(v) && text(v.summary, 800) && Array.isArray(v.traits) && v.traits.length >= 1 && v.traits.length <= 6 && v.traits.every(t => record(t) && text(t.id, 60) && text(t.technique, 120) && text(t.adaptation, 400) && text(t.basis, 400)) && new Set(v.traits.map(t => t.id)).size === v.traits.length;
}
export function validRegion(v: unknown): v is FrameRegion {
  if (!record(v) || !['x', 'y', 'width', 'height', 'confidence'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]))) return false;
  const r = v as unknown as FrameRegion;
  return text(r.label, 48) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1.00001 && r.y + r.height <= 1.00001 && r.confidence >= .65 && r.confidence <= 1;
}
// A bad optional localization must not discard an otherwise useful craft report.
export function sanitizeRegions(v: unknown): unknown {
  if (!record(v) || !Array.isArray(v.checklist)) return v;
  return { ...v, checklist: v.checklist.map(c => record(c) ? { ...c, region: c.status === 'attention' && validRegion(c.region) ? c.region : null } : c) };
}
export function containedMediaRect(containerWidth: number, containerHeight: number, mediaWidth: number, mediaHeight: number) {
  if (![containerWidth, containerHeight, mediaWidth, mediaHeight].every(v => Number.isFinite(v) && v > 0)) return { left: 0, top: 0, width: 0, height: 0 };
  const scale = Math.min(containerWidth / mediaWidth, containerHeight / mediaHeight);
  const width = mediaWidth * scale, height = mediaHeight * scale;
  return { left: (containerWidth - width) / 2, top: (containerHeight - height) / 2, width, height };
}
export function validImage(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 2_800_000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
}
export const exampleBrief: SceneBrief = {
  scene: 'A character waits alone at a window for someone who may never arrive.',
  intention: 'Quiet anticipation, with distance rather than obvious sadness.',
  constraints: 'One actor, a phone, available window light. No crew or extra lights.',
};
// Deliberately static technical exercises, never presented as generated or image analysis.
export const rehearsalShots: Shot[] = [
  { id: 'distance', title: 'Let the room speak', framing: 'Wide, eye-level. Place the character near one edge and leave the room visible.', movement: 'Locked camera; let movement happen inside the frame.', lighting: 'Try available side light. Compare face detail against the window exposure.', rationale: 'A distant perspective can make the environment part of the story. Decide whether that distance supports your intention.', tradeoff: 'Facial details become less legible; the setting carries more weight.' },
  { id: 'presence', title: 'Stay with the character', framing: 'Medium, eye-level. Keep hands and some surrounding space in view.', movement: 'Begin static. Only move closer if you want a shift in attention.', lighting: 'Try turning the subject slightly toward the available light.', rationale: 'A medium frame offers a balance between performance and setting. You choose which gesture matters.', tradeoff: 'Less environmental distance than a wide; less facial detail than a close-up.' },
  { id: 'detail', title: 'Find a small detail', framing: 'Close-up of a detail you choose: hands, an object, or a face.', movement: 'Hold steady long enough to let the detail register.', lighting: 'Move the camera to compare how the existing light reveals texture.', rationale: 'A detail can direct attention without explaining the whole scene. Choose what deserves that attention.', tradeoff: 'Context is reduced; viewers may need another shot to understand the space.' },
];
export const rehearsalReview: FrameReview = {
  observation: 'Rehearsal only: this frame has not been analyzed by an AI model.',
  alignment: 'Compare the frame with your stated intention and your chosen shot. There is no universal correct composition.',
  suggestions: [
    { action: 'Check the edges of the frame.', reason: 'Keep or remove distracting elements according to what you want the audience to notice.' },
    { action: 'Compare the brightest area with your intended point of attention.', reason: 'If they differ, try changing the camera angle or subject position, then compare.' },
    { action: 'Record a short held take before adjusting.', reason: 'Movement and timing can change how a composition feels; a still frame cannot establish that.' },
  ],
  uncertainty: 'These are general self-review prompts, not observations about the uploaded image or the performer’s emotions.',
};

export function validColorLook(v: unknown): v is ColorLook {
  return record(v) && text(v.id, 60) && text(v.name, 80) && text(v.interpretation, 500) &&
    ['lighting', 'styling', 'grading', 'tradeoff'].every(k => text(v[k], 500)) &&
    Array.isArray(v.colors) && v.colors.length >= 3 && v.colors.length <= 5 &&
    v.colors.every(c => record(c) && typeof c.hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.hex) && text(c.role, 100));
}
export function validLooks(v: unknown): v is { looks: ColorLook[] } {
  return record(v) && Array.isArray(v.looks) && v.looks.length === 3 && v.looks.every(validColorLook) && new Set(v.looks.map(l => l.id)).size === 3;
}
// Named technical exercises, never claimed to be scene-specific AI recommendations.
export const rehearsalLooks: ColorLook[] = [
  { id: 'warm-pool', name: 'A pool of warmth', interpretation: 'Explore intimacy or concentration with a small warm area surrounded by cooler space.', colors: [{ hex: '#152536', role: 'Cool background' }, { hex: '#DCA461', role: 'Warm practical accent' }, { hex: '#E8DCC8', role: 'Soft neutral' }, { hex: '#302C2B', role: 'Deep shadow' }], lighting: 'Compare an existing warm lamp with cooler ambient light; keep the subject readable.', styling: 'Try muted navy and cream. Keep strong amber accents small.', grading: 'Compare gently cool shadows with warm highlights; preserve natural skin detail.', tradeoff: 'Strong warm/cool separation may feel stylized rather than natural.' },
  { id: 'cool-pressure', name: 'Cool under pressure', interpretation: 'Explore tension or urgency through restrained color and cooler surrounding space.', colors: [{ hex: '#17363E', role: 'Cool environment' }, { hex: '#8CA9AE', role: 'Muted midtone' }, { hex: '#ECEBE2', role: 'Neutral highlight' }, { hex: '#42474C', role: 'Wardrobe base' }], lighting: 'Try available cool ambient light with enough contrast to separate the subject.', styling: 'Reduce competing saturated objects; compare gray, blue and muted teal.', grading: 'Try reduced saturation and gentle cyan shadows without losing face or prop detail.', tradeoff: 'Too much cyan can make skin or a product look unnatural.' },
  { id: 'soft-day', name: 'Room to breathe', interpretation: 'Explore calm or openness with soft contrast and warm neutral surfaces.', colors: [{ hex: '#D9CBB3', role: 'Background neutral' }, { hex: '#87917B', role: 'Muted green accent' }, { hex: '#F1E8D7', role: 'Soft highlight' }, { hex: '#635A50', role: 'Grounding tone' }], lighting: 'Compare soft available side light with less contrast; protect bright areas.', styling: 'Try cream, wood and muted greens already available in the location.', grading: 'Compare lifted shadows and restrained warmth while retaining clear separation.', tradeoff: 'A very soft image can lose emphasis; keep a clear focal point.' },
];
export function rehearsalShotsFor(format: SceneBrief['format']): Shot[] {
  if (format !== 'reel') return rehearsalShots.map(s => ({ ...s }));
  return [
    { id: 'reel-hook', title: 'Show the point first', framing: 'Vertical 9:16 study. Keep the face or key object visible near the center, with optional caption space.', movement: 'Start held; introduce a gesture or object deliberately.', lighting: 'Use available side light so the key detail remains readable.', rationale: 'An immediately legible subject can establish the premise. You decide the hook.', tradeoff: 'A tight opening offers less context; add a wider shot if needed.' },
    { id: 'reel-demo', title: 'Let the action explain', framing: 'Vertical medium study of hands and the subject or product; avoid cutting off the action.', movement: 'Hold one clear demonstration angle.', lighting: 'Compare angles that reveal the action without glare.', rationale: 'Visible steps can support a demonstration without relying entirely on text.', tradeoff: 'A single angle may hide details; plan a separate insert.' },
    { id: 'reel-payoff', title: 'Give the result room', framing: 'Vertical close detail or reveal. Keep important detail away from the lower and right edges where app controls may sit.', movement: 'Try a steady reveal, then hold the finished result.', lighting: 'Keep the result readable using available light.', rationale: 'A clear end image can complete the premise you chose.', tradeoff: 'A still cannot establish whether the reveal, timing or overall pacing works.' },
  ];
}

export interface FootageFrame { time: number; image: string }
export interface FootageReview { summary: string; uncertainty: string; samples: { time: number; review: FrameReview }[] }
export function footageSampleTimes(duration: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0 || duration > 60) return [];
  return [.05, .35, .65, .95].map(f => Number((duration * f).toFixed(6)));
}
export function validFootageFrames(value: unknown, duration: unknown): value is FootageFrame[] {
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0 || duration > 60 || !Array.isArray(value) || value.length !== 4) return false;
  return value.every((f, i) => record(f) && typeof f.time === 'number' && Number.isFinite(f.time) && f.time >= 0 && f.time < duration && (i === 0 || f.time > value[i - 1].time) && validImage(f.image) && f.image.length <= 500_000);
}
// Bind every report to a supplied timestamp. Never render invented timeline positions.
export function parseFootageReview(value: unknown, frames: FootageFrame[]): FootageReview | null {
  if (!record(value) || !text(value.summary, 1200) || !text(value.uncertainty, 1200) || !Array.isArray(value.samples) || value.samples.length !== frames.length) return null;
  const samples: FootageReview['samples'] = [];
  for (let i = 0; i < frames.length; i++) {
    const sample = value.samples[i];
    if (!record(sample) || sample.time !== frames[i].time) return null;
    const review = sanitizeRegions(sample.review);
    if (!validAssessedReview(review)) return null;
    samples.push({ time: sample.time, review: reviewFromChecklist(review) });
  }
  return { summary: value.summary, uncertainty: value.uncertainty, samples };
}

export function validDirectorNotes(value: unknown): value is DirectorNotes {
  return record(value) && ['reading', 'strength', 'question'].every(k => text(value[k], 700)) &&
    Array.isArray(value.explorations) && value.explorations.length >= 2 && value.explorations.length <= 4 &&
    value.explorations.every(e => record(e) && text(e.id, 60) && text(e.title, 100) && ['observation','experiment','effect','tradeoff'].every(k => text(e[k], 700)) && ['edit','reshoot','either'].includes(e.feasibility as string) && (e.factors === undefined || (Array.isArray(e.factors) && e.factors.length >= 1 && e.factors.length <= 4 && e.factors.every(f => ['composition','lighting','color','background'].includes(f as string)) && new Set(e.factors).size === e.factors.length))) &&
    new Set(value.explorations.map(e => e.id)).size === value.explorations.length;
}
