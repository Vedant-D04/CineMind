import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire,Module} from 'node:module';
import ts from 'typescript';
import * as domain from '../src/lib/sceneBuilder.ts';
import * as cinema from '../src/lib/cinemind.ts';
const require=createRequire(import.meta.url);
const m=new Module(import.meta.filename);m.require=n=>n==='@/lib/sceneBuilder'?domain:require(n);m._compile(ts.transpileModule(readFileSync(new URL('../src/app/api/scene/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,import.meta.filename);
const {POST}=m.exports;
const requirements={premise:'Player practices against a wall',emotion:'Isolation and determination',setting:'Daylight court',resources:'Phone, one player, racket and ball',mustKeep:'No extra actors',inspiration:'Patient wide framing'};
const draft={title:'One more return',scene:'The lone player returns to the wall, steadies their grip, and resumes practice.',intention:requirements.emotion,constraints:requirements.resources+'; '+requirements.mustKeep,additions:['A pause before resuming is proposed.'],visualPrompt:'One player facing the court wall, wide composition, available daylight.'};
const request=value=>new Request('http://localhost/api/scene',{method:'POST',body:JSON.stringify(value)});
test('scene development validates requirements, preserves constraints in context and bounds model output',async t=>{
 const old=process.env.META_API_KEY;process.env.META_API_KEY='test-placeholder';t.after(()=>{if(old===undefined)delete process.env.META_API_KEY;else process.env.META_API_KEY=old;});
 let calls=0,reply=draft,status=200,body;
 t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;assert.equal(url,'https://api.meta.ai/v1/chat/completions');body=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(reply)}}]}),{status});});
 for(const bad of [{...requirements,premise:''},{...requirements,resources:''},{...requirements,inspiration:'x'.repeat(801)}])assert.equal((await POST(request({requirements:bad,format:'film'}))).status,400);
 assert.equal(calls,0);
 const result=await(await POST(request({requirements,format:'film'}))).json();assert.deepEqual(result.draft,draft);assert.deepEqual(JSON.parse(body.messages[1].content).requirements,requirements);assert.match(body.messages[0].content,/disclose it in additions/);assert.match(body.messages[0].content,/preserving every stated must-have/);
 assert.ok(cinema.validBrief({...cinema.exampleBrief,scene:draft.scene,intention:draft.intention,constraints:draft.constraints,visualPrompt:draft.visualPrompt}));
 for(const malformed of [{...draft,scene:'x'.repeat(4001)},{...draft,visualPrompt:''},{...draft,additions:['x'.repeat(501)]}]){reply=malformed;assert.equal((await POST(request({requirements,format:'film'}))).status,502);}
 status=429;assert.match((await(await POST(request({requirements,format:'film'}))).json()).error,/rate limit/);
});
