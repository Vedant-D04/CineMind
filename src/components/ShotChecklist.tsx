import { SHOT_CHECKS, type ShotCheck } from '@/lib/cinemind';
const statusLabels = { attention: 'Consider', clear: 'No issue seen', uncertain: 'Unclear', not_applicable: 'Not needed' };
export default function ShotChecklist({ checks, selected, onLocate, idPrefix = 'check' }: { idPrefix?: string; checks?: ShotCheck[]; selected?: string | null; onLocate?: (category: string) => void }) {
  return <div className="studio-shot-checklist"><div className="studio-checklist-heading"><span>SHOT CHECKS</span><small>{checks ? 'This snapshot' : 'Waiting for a snapshot'}</small></div>{SHOT_CHECKS.map(category => {
    const check = checks?.find(c => c.category === category.id);
    return <details open={check?.status === 'attention'} key={category.id} className={`studio-shot-check check-${check?.status || 'waiting'} ${selected === category.id ? 'is-selected' : ''}`} id={`${idPrefix}-${category.id}`}><summary><span className="studio-check-number">{SHOT_CHECKS.findIndex(c => c.id === category.id) + 1}</span><span>{category.label}</span><small>{check ? statusLabels[check.status] : 'Not checked'}</small></summary><p>{check?.evidence || category.description}</p>{check?.status === 'attention' && <div className="studio-check-adjustment"><span>TRY</span><p className="studio-check-action">{check.action}</p><p>{check.reason}</p></div>}{check?.region && onLocate && <button className="studio-locate-issue" type="button" onClick={() => onLocate(category.id)}>Locate in frame ↗</button>}</details>;
  })}</div>;
}
