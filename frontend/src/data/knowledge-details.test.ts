import {describe,it,expect} from 'vitest';
import {graphNodes,graphLinks} from './graph-structure';
import {knowledgeDetails} from './knowledge-details';
import {comparisons} from './comparisons';
describe('textbook coverage',()=>{
  it('joins exactly 16 complete lessons to the draft and keeps assessment out of them',()=>{
    expect(knowledgeDetails).toHaveLength(16);
    for(const n of graphNodes.filter(n=>n.kind==='detail')){
      const matches=knowledgeDetails.filter(d=>d.id===n.contentId);expect(matches).toHaveLength(1);
      const lesson=matches[0];expect(lesson.title).toBe(n.title);expect(lesson.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(lesson.source).toMatch(/PDF第.+页，书页/);expect(lesson.note.length).toBeGreaterThan(20);
      expect(lesson).not.toHaveProperty('level');expect(lesson).not.toHaveProperty('questionIds');
    }
  });
  it('provides original textbook figures and explanations for both comparisons',()=>{
    for(const id of ['TOA-4','TDOA-4','RSS-2','RSS-4','AOA-2','AOA-3'])expect(knowledgeDetails.find(d=>d.id===id)?.figures?.[0].src).toBeTruthy();
    for(const l of graphLinks.filter(l=>l.type==='comparison'))expect(comparisons[l.id].source).toMatch(/PDF/);
  });
});
