import test from 'node:test';
import assert from 'node:assert/strict';
import { validBrief, validShot, validPlan, validReview, validImage, validChecklist, validAssessedReview, reviewFromChecklist, SHOT_CHECKS, exampleBrief, rehearsalShots, rehearsalReview } from '../src/lib/cinemind.ts';

test('requires intention and bounds the brief', () => {
  assert.equal(validBrief(exampleBrief), true);
  for (const value of [null, {}, { ...exampleBrief, intention: '  ' }, { ...exampleBrief, scene: 'x'.repeat(4001) }]) assert.equal(validBrief(value), false);
});
test('accepts exactly three complete distinct shots', () => {
  assert.equal(validPlan({ shots: rehearsalShots }), true);
  assert.equal(validPlan({ shots: rehearsalShots.slice(0, 2) }), false);
  assert.equal(validPlan({ shots: [rehearsalShots[0], rehearsalShots[0], rehearsalShots[2]] }), false);
  assert.equal(validShot({ ...rehearsalShots[0], tradeoff: '' }), false);
});
test('requires observations, uncertainty, and bounded review actions', () => {
  assert.equal(validReview(rehearsalReview), true);
  assert.equal(validReview({ ...rehearsalReview, uncertainty: '' }), false);
  assert.equal(validReview({ ...rehearsalReview, suggestions: [] }), false);
  assert.equal(validReview({ ...rehearsalReview, suggestions: Array(7).fill(rehearsalReview.suggestions[0]) }), false);
});
test('rejects remote URLs, SVG and oversized frames', () => {
  assert.equal(validImage('data:image/jpeg;base64,YWJj'), true);
  for (const value of ['https://example.com/image.jpg', 'data:image/svg+xml;base64,YWJj', 'data:image/jpeg;base64,' + 'a'.repeat(2800000), null]) assert.equal(validImage(value), false);
});

const clearChecklist = () => SHOT_CHECKS.map(c => ({ category: c.id, status: 'clear', evidence: 'Visible and appropriate for this shot.', action: '', reason: '' }));
test('assessment requires complete distinct checks with evidence and actionable concerns', () => {
  const checklist = clearChecklist();
  assert.equal(validChecklist(checklist), true);
  assert.equal(validChecklist(checklist.slice(1)), false);
  assert.equal(validChecklist([checklist[0], ...checklist.slice(0, 5)]), false);
  assert.equal(validChecklist([{ ...checklist[0], status: 'attention', action: '' }, ...checklist.slice(1)]), false);
  assert.equal(validAssessedReview(rehearsalReview), false);
});
test('a lighting-heavy response still reports every independent concern including a cropped head', () => {
  const checklist = clearChecklist().map(c => ({ ...c, status: 'attention', evidence: c.category === 'subject' ? 'The head is cropped out of the planned medium portrait.' : 'A visible concern.', action: 'Adjust ' + c.category, reason: 'Supports the chosen shot.' }));
  const result = reviewFromChecklist({ ...rehearsalReview, suggestions: [{ action: 'Move to a darker spot.', reason: 'Nighttime mood.' }], checklist });
  assert.equal(result.suggestions.length, 6);
  assert.ok(result.suggestions.some(s => s.action === 'Adjust subject'));
  assert.ok(result.suggestions.some(s => s.action === 'Adjust lighting'));
  assert.equal(validReview(result), true);
});
test('intentional exclusions are preserved and are not turned into corrective cues', () => {
  const checklist = clearChecklist(); checklist[0] = { ...checklist[0], status: 'not_applicable', evidence: 'The chosen shot explicitly shows only hands on a keyboard.' };
  const result = reviewFromChecklist({ ...rehearsalReview, checklist });
  assert.equal(result.checklist[0].status, 'not_applicable');
  assert.equal(result.suggestions.length, 1);
  assert.doesNotMatch(result.suggestions[0].action, /head|face/);
});

test('palette and format inputs are bounded and old saved briefs remain valid', async () => {
  const { validColorLook, validLooks, rehearsalLooks, exampleBrief, validBrief, rehearsalShotsFor } = await import('../src/lib/cinemind.ts');
  assert.equal(validBrief(exampleBrief), true);
  assert.equal(validBrief({ ...exampleBrief, format: 'reel', look: rehearsalLooks[0] }), true);
  assert.equal(validBrief({ ...exampleBrief, format: 'unsupported' }), false);
  assert.equal(validLooks({ looks: rehearsalLooks }), true);
  assert.equal(validLooks({ looks: [rehearsalLooks[0], rehearsalLooks[0], rehearsalLooks[2]] }), false);
  assert.equal(validColorLook({ ...rehearsalLooks[0], colors: [{ hex: 'red;position:absolute', role: 'background' }] }), false);
  assert.equal(validColorLook({ ...rehearsalLooks[0], lighting: 'x'.repeat(501) }), false);
  assert.equal(rehearsalShotsFor('reel').length, 3);
  assert.match(rehearsalShotsFor('reel')[0].framing, /Vertical/);
  assert.equal(rehearsalShotsFor('film')[0].id, 'distance');
});

test('recorded footage binds four complete reports to real timestamps', async () => {
  const d = await import('../src/lib/cinemind.ts');
  const frames = d.footageSampleTimes(20).map(time => ({ time, image: 'data:image/jpeg;base64,YWJj' }));
  assert.equal(d.validFootageFrames(frames, 20), true);
  assert.deepEqual(d.footageSampleTimes(61), []);
  assert.equal(d.validFootageFrames(frames.slice(0, 3), 20), false);
  assert.equal(d.validFootageFrames([...frames].reverse(), 20), false);
  assert.equal(d.validFootageFrames(frames, NaN), false);
  const review = { ...d.rehearsalReview, checklist: d.SHOT_CHECKS.map(c => ({ category: c.id, status: 'clear', evidence: 'Visible and readable.', action: '', reason: '' })) };
  const output = { summary: 'Four visible moments.', uncertainty: 'Intervals and audio were not assessed.', samples: frames.map(f => ({ time: f.time, review })) };
  assert.equal(d.parseFootageReview(output, frames).samples.length, 4);
  assert.equal(d.parseFootageReview({ ...output, samples: [...output.samples].reverse() }, frames), null);
  assert.equal(d.parseFootageReview({ ...output, samples: output.samples.map(s => ({ ...s, time: 999 })) }, frames), null);
  assert.equal(d.parseFootageReview({ ...output, samples: output.samples.map(s => ({ ...s, review: { ...review, checklist: [] } })) }, frames), null);
});

test('director notes preserve scene reasoning, experiments, tradeoffs and feasibility', async () => {
  const d = await import('../src/lib/cinemind.ts');
  const notes = { reading:'The small figure and visible wall support the requested solitary practice.', strength:'Keep the wall visible as the opposing presence.', question:'Should the wall or the player carry the scene?', explorations:[{id:'space',title:'Let the wall dominate',observation:'The wall takes most of the frame.',experiment:'Compare slightly less foreground.',effect:'Supports the requested isolation.',tradeoff:'The body gesture becomes less prominent.',feasibility:'edit'},{id:'body',title:'Bring the gesture forward',observation:'The racket is close to the frame edge.',experiment:'For a reshoot, widen to include the swing space.',effect:'Keeps the intended training action readable.',tradeoff:'Less visual pressure from tight framing.',feasibility:'reshoot'}] };
  assert.equal(d.validDirectorNotes(notes),true);
  assert.equal(d.validDirectorNotes({...notes,explorations:[notes.explorations[0]]}),false);
  assert.equal(d.validDirectorNotes({...notes,explorations:[notes.explorations[0],notes.explorations[0]]}),false);
  assert.equal(d.validDirectorNotes({...notes,explorations:notes.explorations.map(e=>({...e,effect:''}))}),false);
  assert.equal(d.validDirectorNotes({...notes,explorations:notes.explorations.map(e=>({...e,feasibility:'automatic-video-fix'}))}),false);
});
