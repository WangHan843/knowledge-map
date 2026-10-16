import {staticPrefix} from './runtime';
import {ensureStudent} from './student-session';
import type {NodeId} from '../types';
import type {LocalMistake} from './local-learning';

async function adapter(){
 return localAdapter();
}
async function localAdapter(){
 const student=await ensureStudent();
 const {createLocalLearning}=await import('./local-learning');
 return createLocalLearning(localStorage,`${staticPrefix}:records:${student.student_id}`);
}
export const learningApi={
 questions:async(node?:NodeId)=>(await adapter()).questions(node),
 check:async(id:string,selected:string,requestId:string)=>(await adapter()).check(id,selected,requestId),
 start:async()=>(await adapter()).start(),
 current:async()=>(await adapter()).current(),
 levels:async()=>(await adapter()).levels(),
 resume:async(id:string)=>(await adapter()).resume(id),
 submit:async(id:string,answers:Record<string,string>)=>(await adapter()).submit(id,answers),
 async mistakes():Promise<LocalMistake[]>{return (await localAdapter()).mistakes();},
};
