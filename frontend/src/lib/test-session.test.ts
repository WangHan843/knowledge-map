import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {readDraft,saveDraft} from './test-session';
import {studentKey} from './runtime';
beforeEach(()=>{
 const data=new Map<string,string>();
 vi.stubGlobal('localStorage',{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value)});
 localStorage.setItem(studentKey,JSON.stringify({student_id:'a'.repeat(32),token:'b'.repeat(64)}));
});
afterEach(()=>vi.unstubAllGlobals());
it('navigation from a stale tab preserves previously saved answers',()=>{
 saveDraft('first',{'toa-01':'A'},0);
 saveDraft('first',{},1);
 expect(readDraft('first')?.answers).toEqual({'toa-01':'A'});
 saveDraft('first',{'rss-01':'B'},2);
 expect(readDraft('first')?.answers).toEqual({'toa-01':'A','rss-01':'B'});
});
it('a stale earlier test cannot overwrite another test draft',()=>{
 saveDraft('first',{'toa-01':'A'},0);saveDraft('second',{'tdoa-01':'B'},1);
 saveDraft('first',{},2);
 expect(readDraft('second')?.answers).toEqual({'tdoa-01':'B'});
});
