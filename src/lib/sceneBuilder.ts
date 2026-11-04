export const sceneQuestions = [
  {key:'premise',label:'Who is in the scene, and what happens?',hint:'A tennis player keeps practicing against a wall after a setback.',max:1200},
  {key:'emotion',label:'What should the audience feel?',hint:'Isolation turning into quiet determination.',max:800},
  {key:'setting',label:'Where and when does it happen?',hint:'An empty outdoor court, late afternoon.',max:800},
  {key:'resources',label:'What can you actually shoot with?',hint:'One actor, a phone, racket, ball and available daylight.',max:1000},
  {key:'mustKeep',label:'What must stay? What should we avoid?',hint:'Keep the wall central. No extra actors, dialogue or dramatic floodlights.',max:1000},
  {key:'inspiration',label:'Any visual preferences or references?',hint:'Patient wide shots, restrained color, occasional detail of the racket grip.',max:800},
] as const;
export type SceneRequirements = Record<typeof sceneQuestions[number]['key'],string>;
export interface SceneDraft { title:string; scene:string; intention:string; constraints:string; additions:string[]; visualPrompt:string }
export function validRequirements(value:unknown):value is SceneRequirements {
 if(!value||typeof value!=='object')return false;
 const v=value as Record<string,unknown>;
 return sceneQuestions.every(q=>typeof v[q.key]==='string'&&(v[q.key] as string).length<=q.max)&&['premise','emotion','resources'].every(k=>(v[k] as string).trim().length>0);
}
export function validSceneDraft(value:unknown):value is SceneDraft {
 if(!value||typeof value!=='object')return false;
 const v=value as Record<string,unknown>;
 return [['title',120],['scene',4000],['intention',1000],['constraints',1000],['visualPrompt',1800]].every(([k,max])=>typeof v[k as string]==='string'&&!!(v[k as string] as string).trim()&&(v[k as string] as string).length<=Number(max))&&Array.isArray(v.additions)&&v.additions.length<=6&&v.additions.every(x=>typeof x==='string'&&!!x.trim()&&x.length<=500);
}
