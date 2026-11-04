import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import ts from 'typescript';
import * as domain from '../src/lib/cinemind.ts';
import * as retrieval from '../src/lib/referenceRetrieval.ts';

// Exercise the actual Next route with only its network boundary replaced.
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../src/app/api/copilot/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = new Module(import.meta.filename);
module.require = name => name === '@/lib/cinemind' ? domain : name === '@/lib/referenceRetrieval' ? retrieval : require(name);
module._compile(compiled, import.meta.filename);
const { POST } = module.exports;
const payload = { action: 'live', brief: domain.exampleBrief, shot: domain.rehearsalShots[0], image: 'data:image/jpeg;base64,YWJj', previousGuidance: 'Try a wider frame.' };
const request = body => new Request('http://localhost/api/copilot', { method: 'POST', body: JSON.stringify(body) });

test('live guidance protects its request and handles upstream results', async t => {
  const originalKey = process.env.META_API_KEY;
  process.env.META_API_KEY = 'unit-test-placeholder';
  t.after(() => { if (originalKey === undefined) delete process.env.META_API_KEY; else process.env.META_API_KEY = originalKey; });
  let calls = 0;
  let upstreamRequest;
  let status = 200;
  let reply = { ...domain.rehearsalReview, checklist: domain.SHOT_CHECKS.map(c => ({ category: c.id, status: 'clear', evidence: 'No visible mismatch.', action: '', reason: '' })) };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++; assert.equal(url, 'https://api.meta.ai/v1/chat/completions'); upstreamRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }), { status });
  });
  await t.test('invalid live context never makes a model request', async () => {
    for (const body of [{ ...payload, previousGuidance: 'x'.repeat(1001) }, { ...payload, previousGuidance: [] }, { ...payload, image: 'https://untrusted.invalid/image' }]) assert.equal((await POST(request(body))).status, 400);
    assert.equal(calls, 0);
  });
  await t.test('passes filmmaker intent, image and previous cue, requests a complete concise shot report', async () => {
    const response = await POST(request(payload));
    assert.equal(response.status, 200);
    const result = await response.json(); assert.equal(result.source, 'meta'); assert.deepEqual(result.review, domain.reviewFromChecklist(domain.sanitizeRegions(reply)));
    const context = JSON.parse(upstreamRequest.messages[1].content[0].text);
    assert.equal(upstreamRequest.response_format.type, 'json_object');
    assert.equal(upstreamRequest.reasoning_effort, 'low');
    assert.deepEqual(context.brief, payload.brief); assert.deepEqual(context.chosenShot, payload.shot); assert.equal(context.previousSuggestion, payload.previousGuidance);
    assert.match(upstreamRequest.messages[0].content, /report ALL applicable concerns/);
    assert.match(upstreamRequest.messages[0].content, /Do not select, rank, or suppress concerns/);
    assert.match(upstreamRequest.messages[0].content, /do not claim.*continuous video/);
  });
  await t.test('reference planning retrieves user notes, sends sampled frames and never fetches an attribution URL', async () => {
    const reference = { director: 'User influence', goal: 'inspired', notes: 'Use window light and negative space. Let room details establish distance.', link: 'https://example.invalid/not-fetched' };
    reply = { shots: domain.rehearsalShots, referenceStudy: { summary: 'Room and light study from supplied notes.', traits: [{ id: 'space', technique: 'Negative space', adaptation: 'Keep one side of the room visible.', basis: 'Your notes: note-1' }] } };
    const response = await POST(request({ action: 'plan', brief: { ...domain.exampleBrief, reference }, referenceFrames: [payload.image] }));
    assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.referenceStudy.traits[0].id, 'space');
    const context = JSON.parse(upstreamRequest.messages[1].content[0].text);
    assert.ok(context.referencePassages.length > 0); assert.equal(context.brief.reference.notes, undefined);
    assert.equal(upstreamRequest.messages[1].content.filter(c => c.type === 'image_url').length, 1);
    assert.match(upstreamRequest.messages[0].content, /Never claim to have opened the link/);
  });
  await t.test('live review carries selected reference traits without re-sending reference notes, media or a director stereotype', async () => {
    reply = { ...domain.rehearsalReview, checklist: domain.SHOT_CHECKS.map(c => ({ category: c.id, status: 'clear', evidence: 'No visible mismatch.', action: '', reason: '' })) };
    const reference = { director: 'Example director', goal: 'inspired', notes: 'Unselected preference for blue light.', link: '' };
    const selectedShot = { ...payload.shot, referenceTraits: ['Negative space: keep one side open.'] };
    const response = await POST(request({ ...payload, brief: { ...payload.brief, reference }, shot: selectedShot }));
    assert.equal(response.status, 200);
    const context = JSON.parse(upstreamRequest.messages[1].content[0].text);
    assert.deepEqual(context.chosenShot.referenceTraits, selectedShot.referenceTraits);
    assert.deepEqual(context.referencePassages, []); assert.equal(context.brief.reference.director, undefined);
    assert.equal(upstreamRequest.messages[1].content.filter(c => c.type === 'image_url').length, 1);
  });
  await t.test('look lab returns three validated proposals without sending a camera image', async () => {
    reply = { looks: domain.rehearsalLooks };
    const response = await POST(request({ action: 'looks', brief: { ...payload.brief, format: 'reel' } }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).looks.length, 3);
    assert.equal(typeof upstreamRequest.messages[1].content, 'string');
    assert.match(upstreamRequest.messages[0].content, /exactly THREE/);
    assert.match(upstreamRequest.messages[0].content, /FORMAT: REELS/);
    assert.match(upstreamRequest.messages[0].content, /not inferred feelings/);
    reply = { looks: [domain.rehearsalLooks[0]] };
    assert.equal((await POST(request({ action: 'looks', brief: payload.brief }))).status, 502);
  });
  await t.test('selected palette and format reach live checks without dropping basic craft coverage', async () => {
    reply = { ...domain.rehearsalReview, checklist: domain.SHOT_CHECKS.map(c => ({ category: c.id, status: 'clear', evidence: 'No visible mismatch.', action: '', reason: '' })) };
    const response = await POST(request({ ...payload, brief: { ...payload.brief, format: 'reel', look: domain.rehearsalLooks[0] } }));
    assert.equal(response.status, 200);
    const context = JSON.parse(upstreamRequest.messages[1].content[0].text);
    assert.deepEqual(context.brief.look, domain.rehearsalLooks[0]);
    assert.match(upstreamRequest.messages[0].content, /ALL basic craft checks/);
    assert.match(upstreamRequest.messages[0].content, /app-interface clearance/);
    assert.match(upstreamRequest.messages[0].content, /Do not claim to assess hook timing/);
    await POST(request({ ...payload, brief: { ...payload.brief, format: 'film' } }));
    assert.match(upstreamRequest.messages[0].content, /FORMAT: FILM/);
    assert.doesNotMatch(upstreamRequest.messages[0].content, /FORMAT: REELS/);
  });
  await t.test('recorded footage sends four own-footage samples, preserves timestamps and requires no planned shot', async () => {
    const frames = domain.footageSampleTimes(20).map(time => ({ time, image: payload.image }));
    const review = { ...domain.rehearsalReview, director: { reading: 'The wide room makes waiting feel solitary.', strength: 'Keep the window as a spatial anchor.', question: 'Should the room or the gesture carry this moment?', explorations: [{ id:'space',title:'Let the room carry the wait',observation:'The figure occupies little of the visible room.',experiment:'Compare a slightly wider crop only if captured.',effect:'More surrounding space may support the requested solitude.',tradeoff:'Facial detail becomes less prominent.',feasibility:'edit'},{ id:'gesture',title:'Stay with the gesture',observation:'Hands are small relative to the setting.',experiment:'For a reshoot, try a medium frame including hands.',effect:'A readable small gesture may carry anticipation.',tradeoff:'The room has less narrative weight.',feasibility:'reshoot'}] }, checklist: domain.SHOT_CHECKS.map(c => ({ category: c.id, status: 'clear', evidence: 'Visible and readable.', action: '', reason: '' })) };
    reply = { summary: 'Four sampled moments.', uncertainty: 'Intervals and audio were not reviewed.', samples: frames.map(f => ({ time: f.time, review })) };
    const response = await POST(request({ action: 'footage', brief: payload.brief, duration: 20, frames, shot: null }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).footageReview.samples.length, 4);
    assert.equal(upstreamRequest.messages[1].content.filter(c => c.type === 'image_url').length, 4);
    assert.match(upstreamRequest.messages[0].content, /ALREADY RECORDED/);
    assert.match(upstreamRequest.messages[0].content, /SCENE REQUIREMENTS ARE THE BASIS/);
    assert.match(upstreamRequest.messages[0].content, /explicitly connect every effect to THIS scene requirement/);
    assert.match(upstreamRequest.messages[0].content, /Do not give a generic good\/bad photography audit/);
    assert.equal(JSON.parse(upstreamRequest.messages[1].content[0].text).brief.scene, payload.brief.scene);
    assert.match(upstreamRequest.messages[0].content, /requiring a reshoot/);
    assert.match(upstreamRequest.messages[0].content, /Complete ALL SIX categories at EACH timestamp/);
    const before = calls;
    for (const bad of [{ duration: 90, frames }, { duration: 20, frames: frames.slice(0, 3) }, { duration: 20, frames: [...frames].reverse() }]) assert.equal((await POST(request({ action: 'footage', brief: payload.brief, ...bad }))).status, 400);
    assert.equal(calls, before);
    reply.samples[0].time = 19;
    assert.equal((await POST(request({ action: 'footage', brief: payload.brief, duration: 20, frames }))).status, 502);
    reply = review;
  });
  await t.test('invalid localization is dropped without losing the full report', async () => {
    reply.checklist[0] = { ...reply.checklist[0], status: 'attention', evidence: 'Head is cropped.', action: 'Tilt up.', reason: 'Restore intended headroom.', region: { x: -.5, y: 0, width: 1, height: 1, label: 'bad', confidence: .9 } };
    const response = await POST(request(payload)); assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.review.checklist[0].region, null); assert.equal(data.review.checklist.length, 6);
  });
  await t.test('malformed model output fails safely', async () => {
    reply = { observation: 'Incomplete' };
    assert.equal((await POST(request(payload))).status, 502);
  });
  await t.test('rate limit returns a safe error for the live loop to pause', async () => {
    status = 429;
    const response = await POST(request(payload)); assert.equal(response.status, 502); assert.match((await response.json()).error, /rate limit/);
  });
});
