import type { DirectorExploration, DirectorNotes, SceneBrief } from '@/lib/cinemind';
export default function DirectorNotesPanel({ notes, brief, onVisualize }: { notes: DirectorNotes; brief: SceneBrief; onVisualize: (idea: DirectorExploration) => void }) {
  return <div className="director-notes-panel">
    <div className="director-scene-target"><span>THE SCENE WE’RE SERVING</span><p>{brief.intention}</p></div>
    <div className="director-reading"><p className="cine-eyebrow">A DIRECTOR’S READING</p><h3>What this moment is saying.</h3><p>{notes.reading}</p><div className="director-keep"><span>KEEP WHAT’S WORKING</span><p>{notes.strength}</p></div></div>
    <div className="director-explorations"><p className="cine-eyebrow">DIRECTIONS TO EXPLORE / YOUR CHOICE</p>{notes.explorations.map((idea,i)=><article key={idea.id}><div className="director-idea-title"><span>{String(i+1).padStart(2,'0')}</span><h4>{idea.title}</h4><small>{idea.feasibility === 'edit' ? 'IN THE EDIT' : idea.feasibility === 'reshoot' ? 'FOR A RESHOOT' : 'EDIT OR RESHOOT'}</small></div><p className="director-visible">{idea.observation}</p><dl><dt>Try this</dt><dd>{idea.experiment}</dd><dt>For your scene</dt><dd>{idea.effect}</dd><dt>The tradeoff</dt><dd>{idea.tradeoff}</dd></dl><button type="button" className="cine-secondary" onClick={()=>onVisualize(idea)}>Visualize this direction ↗</button></article>)}</div>
    <div className="director-question"><span>A CHOICE FOR YOU</span><p>{notes.question}</p></div>
  </div>;
}
