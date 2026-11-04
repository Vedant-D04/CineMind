import test from 'node:test';
import assert from 'node:assert/strict';
import { containedMediaRect, validRegion, validReference, validReferenceStudy, sanitizeRegions, SHOT_CHECKS } from '../src/lib/cinemind.ts';
import { retrieveReferenceNotes } from '../src/lib/referenceRetrieval.ts';

test('portrait images are correctly centered inside landscape viewfinders', () => {
  const rect = containedMediaRect(640, 360, 360, 640);
  assert.deepEqual(rect, { left: 218.75, top: 0, width: 202.5, height: 360 });
  assert.equal(rect.left + .5 * rect.width, 320);
});
test('landscape frames remain aligned inside portrait viewfinders', () => {
  assert.deepEqual(containedMediaRect(360, 640, 640, 360), { left: 0, top: 218.75, width: 360, height: 202.5 });
  assert.deepEqual(containedMediaRect(0, 640, 640, 360), { left: 0, top: 0, width: 0, height: 0 });
});
test('only bounded, confident, visible concern regions survive sanitization', () => {
  const good = { x: 0, y: 0, width: .7, height: .08, label: 'Cropped at top edge', confidence: .8 };
  assert.equal(validRegion(good), true);
  for (const region of [{ ...good, x: -.1 }, { ...good, width: 1.1 }, { ...good, confidence: .2 }, { ...good, y: NaN }, { ...good, height: 0 }]) assert.equal(validRegion(region), false);
  const report = sanitizeRegions({ checklist: [
    { category: 'subject', status: 'attention', region: good },
    { category: 'background', status: 'attention', region: { ...good, x: 2 } },
    { category: 'lighting', status: 'uncertain', region: good },
  ] });
  assert.deepEqual(report.checklist[0].region, good);
  assert.equal(report.checklist[1].region, null); assert.equal(report.checklist[2].region, null);
  assert.equal(SHOT_CHECKS.length, 6);
});
test('reference notes retrieve relevant bounded passages without an external embedding service', () => {
  const reference = { director: '', goal: 'inspired', link: '', notes: 'Use warm color for the room.\nKeep the camera static and use symmetry.\nLeave negative space near the window.\nTry close framing of hands at the keyboard.' };
  const result = retrieveReferenceNotes(reference, 'negative space window', 1);
  assert.equal(result.length, 1); assert.match(result[0].text, /negative space/); assert.equal(result[0].source, 'Your reference notes');
  assert.ok(retrieveReferenceNotes(reference, 'camera', 100).length <= 3);
  assert.deepEqual(retrieveReferenceNotes(undefined, 'window'), []);
  assert.deepEqual(retrieveReferenceNotes({ ...reference, notes: '' }, 'window'), []);
});
test('reference inputs reject executable links and oversize text', () => {
  const reference = { director: 'A filmmaker', goal: 'inspired', notes: '', link: 'https://example.com/reference' };
  assert.equal(validReference(reference), true);
  for (const value of [{ ...reference, link: 'javascript:alert(1)' }, { ...reference, notes: 'x'.repeat(6001) }, { ...reference, goal: 'automatic-copy' }]) assert.equal(validReference(value), false);
  const study = { summary: 'A visual study.', traits: [{ id: 'space', technique: 'Negative space', adaptation: 'Keep the room visible.', basis: 'Your reference frame 1' }] };
  assert.equal(validReferenceStudy(study), true);
  assert.equal(validReferenceStudy({ ...study, traits: [study.traits[0], study.traits[0]] }), false);
});
