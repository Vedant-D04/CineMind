// Local lexical retrieval over user-provided notes: no embeddings, remote index or model call.
import type { ReferenceBrief } from './cinemind';
const stopwords = new Set('a an and are as at be by for from in is it of on or that the this to with'.split(' '));
const tokens = (text: string) => (text.toLowerCase().match(new RegExp('[\\p{L}\\p{N}]+', 'gu')) || []).filter(t => t.length > 1 && !stopwords.has(t));
export function retrieveReferenceNotes(reference: ReferenceBrief | undefined, query: string, limit = 3) {
  if (!reference?.notes.trim()) return [];
  const paragraphs = reference.notes.split(/\n+|(?<=[.!?])\s+/).flatMap(p => p.match(/.{1,400}(?:\s|$)|.{1,400}/g) || []).map(p => p.trim()).filter(Boolean);
  const docs = paragraphs.map(tokens), terms = Array.from(new Set(tokens(query)));
  const averageLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, docs.length);
  return paragraphs.map((text, i) => {
    const score = terms.reduce((total, term) => {
      const frequency = docs[i].filter(t => t === term).length;
      const documentsWithTerm = docs.filter(d => d.includes(term)).length;
      const idf = Math.log(1 + (docs.length - documentsWithTerm + .5) / (documentsWithTerm + .5));
      return total + idf * frequency * 2.2 / (frequency + 1.2 * (.25 + .75 * docs[i].length / Math.max(1, averageLength)));
    }, 0);
    return { id: `note-${i + 1}`, source: 'Your reference notes', text, score };
  }).sort((a, b) => b.score - a.score).slice(0, Math.max(0, Math.min(3, limit))).map(({ score: _, ...passage }) => passage);
}
