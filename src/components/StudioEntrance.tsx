'use client';
import { ArrowDown, ArrowRight, Camera, Film, Sparkles } from 'lucide-react';
export type StudioPath='scene'|'review'|'live';
const paths=[
 {id:'scene' as const,number:'01',title:'Imagine a scene.',subtitle:'FROM AN IDEA',description:'Find the story, shape the mood, see the possibility.',action:'Develop a scene',icon:Sparkles},
 {id:'review' as const,number:'02',title:'See your take anew.',subtitle:'FROM YOUR FOOTAGE',description:'Bring a recording. Explore what could make it stronger.',action:'Review footage',icon:Film},
 {id:'live' as const,number:'03',title:'Find it in the frame.',subtitle:'BEHIND THE CAMERA',description:'Choose a direction. Get guidance while you shoot.',action:'Start live direction',icon:Camera},
];
export default function StudioEntrance({onChoose}:{onChoose:(path:StudioPath)=>void}){
 return <section className="studio-entrance" aria-labelledby="entrance-title"><div className="entrance-heading"><p className="cine-eyebrow">A SPACE FOR YOUR NEXT SCENE</p><h1 id="entrance-title">Every frame starts <br/>with <em>you.</em></h1><p>A little cinematic guidance. Wherever you are in the process.</p></div><div className="entrance-filmstrip" aria-label="Choose where to begin">{paths.map(({icon:Icon,...p})=><button className={`entrance-card entrance-${p.id}`} key={p.id} onClick={()=>onChoose(p.id)}><div className="entrance-art" aria-hidden="true"><span className="entrance-card-number">{p.number}</span><div className="entrance-frame"><Icon size={42} strokeWidth={1}/></div><span className="entrance-reticle"/><span className="entrance-timecode">CM / {p.number} : 00 : 24</span></div><div className="entrance-card-copy"><span>{p.subtitle}</span><h2>{p.title}</h2><p>{p.description}</p><div>{p.action}<ArrowRight size={18}/></div></div></button>)}</div><p className="entrance-bottom"><span>YOUR VISION. YOUR FINAL CUT.</span><span className="entrance-swipe">Swipe to explore <ArrowRight size={13}/></span><span className="entrance-desktop">CHOOSE YOUR STARTING POINT <ArrowDown size={13}/></span></p></section>;
}
