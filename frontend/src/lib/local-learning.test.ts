import {beforeEach,expect,it,vi} from 'vitest';
import bank from '../data/questions.json';
import serverBank from '../../../backend/app/questions.json';
import {createLocalLearning,levelFor} from './local-learning';
function storage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};}
let memory:ReturnType<typeof storage>;
beforeEach(()=>{memory=storage();});
const api=()=>createLocalLearning(memory,'test');
it('keeps the existing textbook bank unchanged',()=>expect(bank).toEqual(serverBank));
const answers=(attempt:Awaited<ReturnType<ReturnType<typeof api>['start']>>,correct=true)=>Object.fromEntries(attempt.questions.map(q=>{const answer=bank.find(b=>b.id===q.id)!.answer;return[q.id,correct?answer:['A','B','C','D'].find(a=>a!==answer)!];}));
it('provides 20 textbook questions, 5 per module, without keys in the question DTO',async()=>{
 const a=api();expect(await a.questions()).toHaveLength(20);expect(await a.questions('toa')).toHaveLength(5);
 for(const q of await a.questions()){expect(q).not.toHaveProperty('answer');expect(q).not.toHaveProperty('explanation');expect(q.source).toBeTruthy();}
});
it.each([[0,0,'unassessed'],[39,100,'unskilled'],[40,100,'understood'],[59,100,'understood'],[60,100,'familiar'],[79,100,'familiar'],[80,100,'mastered'],[100,100,'mastered']])('level boundary %s/%s is %s',(c,t,l)=>expect(levelFor(Number(c),Number(t))).toBe(l));
it('practice persists but never changes levels; retry does not duplicate it',async()=>{
 const a=api(),q=bank[0];const feedback=await a.check(q.id,q.answer,'request1');expect(feedback.is_correct).toBe(true);
 expect(await a.check(q.id,q.answer,'request1')).toEqual(feedback);
 expect((await api().history()).practice).toHaveLength(1);
 expect((await api().levels()).every(n=>n.level==='unassessed')).toBe(true);
 await expect(a.check(q.id,'Z','request2')).rejects.toThrow();
});
it('issues six unique questions covering all modules and resumes the same unfinished test',async()=>{
 const a=api(),attempt=await a.start();expect(attempt.questions).toHaveLength(6);
 expect(new Set(attempt.questions.map(q=>q.node_id)).size).toBe(4);expect(new Set(attempt.questions.map(q=>q.id)).size).toBe(6);
 expect(await api().start()).toEqual(attempt);expect(await api().current()).toEqual(attempt);
 await expect(a.submit(attempt.id,{})).rejects.toThrow();expect((await a.levels()).every(n=>n.level==='unassessed')).toBe(true);
});
it('submissions persist immutable originals, reject foreign IDs and count retries once',async()=>{
 const a=api(),attempt=await a.start(),good=answers(attempt),result=await a.submit(attempt.id,good);
 expect(result.correct_count).toBe(6);expect(result.nodes.every(n=>n.level==='mastered')).toBe(true);
 expect(await api().submit(attempt.id,answers(attempt,false))).toEqual(result);
 expect((await api().history()).tests.filter(t=>t.result)).toHaveLength(1);
 await expect(a.submit('missing',good)).rejects.toThrow();expect((await api().current())?.result).toEqual(result);
});
it('accumulates answers, preserves old results, and retains every wrong answer',async()=>{
 const a=api(),first=await a.start(),r1=await a.submit(first.id,answers(first));
 const second=await a.start();await a.submit(second.id,answers(second,false));
 const counts=Object.fromEntries(['toa','tdoa','rss','aoa'].map(m=>[m,{correct:first.questions.filter(q=>q.node_id===m).length,total:[...first.questions,...second.questions].filter(q=>q.node_id===m).length}]));
 expect(await a.levels()).toEqual(Object.entries(counts).map(([node_id,n])=>({node_id,level:levelFor(n.correct,n.total)})));
 expect(await a.submit(first.id,answers(first))).toEqual(r1);expect(await a.mistakes()).toHaveLength(6);
 expect((await a.mistakes()).every(m=>m.answer.selected_option!==m.answer.correct_option&&m.question.source)).toBe(true);
});
it('does not report success on quota failure and keeps corrupted records untouched',async()=>{
 const a=api(),attempt=await a.start(),previous=memory.getItem('test');
 const write=vi.spyOn(memory,'setItem').mockImplementation(()=>{throw new Error('QuotaExceededError');});
 await expect(a.submit(attempt.id,answers(attempt))).rejects.toThrow(/保存/);expect(memory.getItem('test')).toBe(previous);
 write.mockRestore();memory.setItem('test','broken');await expect(a.current()).rejects.toThrow(/损坏/);expect(memory.getItem('test')).toBe('broken');
});
it('keeps repeated wrong practice records and supports concurrent retry serialization',async()=>{
 const a=api(),q=bank[0],wrong=['A','B','C','D'].find(o=>o!==q.answer)!;
 await a.check(q.id,wrong,'one');await a.check(q.id,wrong,'two');
 expect(await a.mistakes()).toHaveLength(2);expect((await a.levels()).every(n=>n.level==='unassessed')).toBe(true);
 const [first,second]=await Promise.all([a.start(),api().start()]);expect(first.id).toBe(second.id);
 const results=await Promise.all([a.submit(first.id,answers(first)),api().submit(first.id,answers(first,false))]);
 expect(results[0]).toEqual(results[1]);expect((await a.history()).tests).toHaveLength(1);
});
