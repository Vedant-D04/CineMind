import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import ts from 'typescript';
import * as domain from '../src/lib/cinemind.ts';
import * as visualTypes from '../src/lib/visualTypes.ts';
const require = createRequire(import.meta.url);
function compile(path, aliases = {}) {
 const m = new Module(import.meta.filename); m.require = name => name in aliases ? aliases[name] : require(name);
 m._compile(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,import.meta.filename);return m.exports;
}
const visual = compile('../src/lib/metaVisuals.ts');
const { POST } = compile('../src/app/api/visuals/route.ts',{'@/lib/cinemind':domain,'@/lib/metaVisuals':visual,'@/lib/visualTypes':visualTypes});
const req = body => new Request('http://localhost/api/visuals',{method:'POST',body:JSON.stringify(body)});
const image = 'data:image/png;base64,YWJj';
// A complete mask from the official parser's published example, with its source geometry.
const text = '<0f>0<|box;x1=211;y1=228;x2=270;y2=254;w=320;h=334|>'+"<|mask;x=0;y=0;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>\n";
function streamResponse(output = text, completed = true) {
 const lane = {item_id:'m1',output_index:0,content_index:0};
 const events = [{type:'response.output_text.delta',...lane,delta:output},{type:'response.output_text.done',...lane,text:output},...(completed?[{type:'response.completed'}]:[])];
 const bytes = new TextEncoder().encode(events.map(e=>'data: '+JSON.stringify(e)+'\r\n\r\n').join(''));
 return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=37)c.enqueue(bytes.slice(i,i+37));c.close();}}),{headers:{'Content-Type':'text/event-stream'}});
}
test('SAM parses chunked events into real mask geometry and composition interpretation',async t=>{
 const oldKey=process.env.META_API_KEY; process.env.META_API_KEY='test-placeholder';
 t.after(()=>{if(oldKey===undefined)delete process.env.META_API_KEY;else process.env.META_API_KEY=oldKey;});
 const composition={observation:'One small subject near the lower right.',options:[{action:'Compare a closer framing.',reason:'More prominence if intended.'}],uncertainty:'The mask does not establish gaze or movement.'};
 let calls=[], samText=text, failInterpretation=false;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const body=JSON.parse(options.body);calls.push({url,body});
  if(url.endsWith('/responses'))return streamResponse(samText);
  if(failInterpretation)return new Response('{}',{status:429});
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(composition)}}]}));
 });
 const payload={action:'segment',brief:domain.exampleBrief,image,prompt:'button',width:320,height:334,context:'recorded'};
 const response=await POST(req(payload));assert.equal(response.status,200);const data=await response.json();
 assert.equal(data.segmentation.subjects.length,1);assert.ok(data.segmentation.subjects[0].path.startsWith('M'));assert.ok(data.segmentation.subjects[0].coverage>0);
 assert.equal(data.segmentation.subjects[0].bounds.left,211);assert.ok(data.segmentation.subjects[0].center.x>211/320);
 assert.deepEqual(data.composition,composition);assert.equal(calls[0].body.model,'sam-3.1');assert.equal(calls[0].body.metadata.mask_encoding,'one_bit');
 assert.equal(calls[1].body.messages[1].content[1].image_url.url,image);assert.match(calls[1].body.messages[0].content,/NOT anatomical headroom/);
 assert.equal(JSON.parse(calls[1].body.messages[1].content[0].text).context,'Already recorded footage');
 const before=calls.length;for(const bad of [{...payload,prompt:''},{...payload,width:999999},{...payload,image:'https://example.invalid/x.png'}])assert.equal((await POST(req(bad))).status,400);assert.equal(calls.length,before);
 samText='';const noMatch=await(await POST(req(payload))).json();assert.deepEqual(noMatch.segmentation.subjects,[]);assert.equal(noMatch.composition,null);assert.equal(calls.length,before+1);
 samText=text;failInterpretation=true;const partial=await(await POST(req(payload))).json();assert.equal(partial.segmentation.subjects.length,1);assert.equal(partial.composition,null);assert.match(partial.compositionWarning,/masks are ready/);
});
test('Muse Image uses explicit one-image generation with selected shot and palette only',async t=>{
 const oldKey=process.env.META_API_KEY;process.env.META_API_KEY='test-placeholder';t.after(()=>{if(oldKey===undefined)delete process.env.META_API_KEY;else process.env.META_API_KEY=oldKey;});
 let body,calls=0,status=200,reply={data:[{b64_json:'YWJj'}],output_format:'png'};
 t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;assert.equal(url,'https://api.meta.ai/v1/images/generations');body=JSON.parse(options.body);return new Response(JSON.stringify(reply),{status});});
 const payload={action:'visualize',brief:{...domain.exampleBrief,format:'reel',look:domain.rehearsalLooks[0],reference:{director:'Unselected influence',notes:'Not chosen',goal:'inspired',link:''}},shot:domain.rehearsalShots[0],direction:'Use a soft contrast.'};
 const result=await(await POST(req(payload))).json();assert.equal(result.image,'data:image/png;base64,YWJj');assert.equal(body.model,'muse-image-1.0');assert.equal(body.n,1);assert.equal(body.size,'1024x1792');assert.equal(body.tool_enablement.enable_web_search,false);assert.match(body.prompt,/A pool of warmth/);assert.doesNotMatch(body.prompt,/Unselected influence/);
 const before=calls;assert.equal((await POST(req({...payload,direction:'x'.repeat(601)}))).status,400);assert.equal(calls,before);
 reply={data:[{url:'https://untrusted.invalid/result'}]};assert.equal((await POST(req(payload))).status,502);
 status=403;assert.match((await(await POST(req(payload))).json()).error,/declined access/);
});
test('an incomplete SAM stream cannot produce a completed mask report',async t=>{
 const oldKey=process.env.META_API_KEY; process.env.META_API_KEY='test-placeholder';
 t.after(()=>{if(oldKey===undefined)delete process.env.META_API_KEY;else process.env.META_API_KEY=oldKey;});
 t.mock.method(globalThis,'fetch',async()=>streamResponse(text,false));
 await assert.rejects(()=>visual.segmentSubject(image,'button',320,334), /complete mask/);
});

test('recorded-frame alternative edits the actual attached image and scopes changes to selected factors', async t => {
  const oldKey=process.env.META_API_KEY;process.env.META_API_KEY='test-placeholder';t.after(()=>{if(oldKey===undefined)delete process.env.META_API_KEY;else process.env.META_API_KEY=oldKey;});
  let calls=0,upstream;
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;assert.equal(url,'https://api.meta.ai/v1/images/edits');upstream=JSON.parse(options.body);return new Response(JSON.stringify({data:[{b64_json:'YWJj'}],output_format:'webp'}));});
  const payload={action:'reimagine',brief:domain.exampleBrief,shot:null,image,direction:'Keep the wall prominent to support solitary persistence.',factors:['composition','color'],scope:'edit'};
  const response=await POST(req(payload));assert.equal(response.status,200);assert.equal((await response.json()).scope,'edit');
  assert.equal(upstream.images[0].image_url,image);assert.equal(upstream.n,1);assert.equal(upstream.tool_enablement.enable_image_search,false);
  assert.match(upstream.prompt,/EDIT-ONLY STUDY/);assert.match(upstream.prompt,/preserve camera viewpoint/);assert.match(upstream.prompt,/composition, color/);assert.match(upstream.prompt,/Quiet anticipation/);
  await POST(req({...payload,scope:'reshoot'}));assert.match(upstream.prompt,/RESHOT CONCEPT/);
  const before=calls;for(const bad of [{...payload,image:'https://example.invalid/untrusted.png'},{...payload,factors:[]},{...payload,factors:['composition','composition']},{...payload,factors:['replace-person']},{...payload,direction:'x'.repeat(1801)}])assert.equal((await POST(req(bad))).status,400);assert.equal(calls,before);
});

test('scene concept generation uses the approved representative frame and requires no planned shot',async t=>{
 const old=process.env.META_API_KEY;process.env.META_API_KEY='test-placeholder';t.after(()=>{if(old===undefined)delete process.env.META_API_KEY;else process.env.META_API_KEY=old;});
 let calls=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;assert.ok(url.endsWith('/images/generations'));const body=JSON.parse(options.body);assert.match(body.prompt,/Keep the wall central/);assert.equal(body.n,1);return new Response(JSON.stringify({data:[{b64_json:'YWJj'}],output_format:'webp'}));});
 const payload={action:'scene-preview',brief:{...domain.exampleBrief,visualPrompt:'Keep the wall central, one player in available daylight.'},direction:''};
 assert.equal((await POST(req(payload))).status,200);
 assert.equal((await POST(req({...payload,brief:domain.exampleBrief}))).status,400);assert.equal(calls,1);
});
