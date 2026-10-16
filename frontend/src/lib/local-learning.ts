import rawBank from '../data/questions.json';
import type {AnswerFeedback,Attempt,Level,MistakeRecord,NodeId,Question,TestResult} from '../types';

const modules:NodeId[]=['toa','tdoa','rss','aoa'];
const options=['A','B','C','D'];
interface BankQuestion {id:string;module:NodeId;question:string;options:{id:string;text:string}[];answer:string;explanation:string;source:string;}
interface SavedTest {id:string;started_at:string;snapshot:BankQuestion[];result:TestResult|null;submitted_at?:string;}
interface SavedPractice {id:string;created_at:string;question:Question;answer:AnswerFeedback;}
interface Records {version:1;tests:SavedTest[];practice:SavedPractice[];}
export interface LocalMistake extends MistakeRecord {mode:'formal'|'practice';created_at:string;}
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
const bank=rawBank as BankQuestion[];
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
export function levelFor(correct:number,total:number):Level{
 if(!total)return 'unassessed';
 if(correct*5<total*2)return 'unskilled';
 if(correct*5<total*3)return 'understood';
 if(correct*5<total*4)return 'familiar';
 return 'mastered';
}
function publicQuestion(q:BankQuestion):Question{return {id:q.id,node_id:q.module,stem:q.question,options:clone(q.options),source:q.source,is_demo:false};}
function feedback(q:BankQuestion,selected:string):AnswerFeedback{return {question_id:q.id,node_id:q.module,selected_option:selected,correct_option:q.answer,is_correct:selected===q.answer,explanation:q.explanation,source:q.source,is_demo:false};}
function levels(records:Records){return modules.map(node_id=>{
 const all=records.tests.flatMap(t=>t.result?.answers??[]).filter(a=>a.node_id===node_id);
 return {node_id,level:levelFor(all.filter(a=>a.is_correct).length,all.length)};
});}
function view(t:SavedTest):Attempt{return {id:t.id,is_demo:false,questions:t.snapshot.map(publicQuestion),result:clone(t.result)};}
function shuffle<T>(items:T[]):T[]{
 const shuffled=[...items];
 for(let i=shuffled.length-1;i>0;i--){
  // Rejection sampling avoids modulo bias when selecting one of i+1 positions.
  const limit=Math.floor(0x100000000/(i+1))*(i+1);let value:number;
  do{value=crypto.getRandomValues(new Uint32Array(1))[0];}while(value>=limit);
  const j=value%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
 }
 return shuffled;
}
function validQuestion(q:BankQuestion){return q&&typeof q.id==='string'&&modules.includes(q.module)&&typeof q.question==='string'&&Array.isArray(q.options)&&q.options.length===4&&q.options.every((o,i)=>o.id===options[i]&&typeof o.text==='string')&&options.includes(q.answer)&&typeof q.explanation==='string'&&typeof q.source==='string';}
function validFeedback(a:AnswerFeedback){return a&&typeof a.question_id==='string'&&modules.includes(a.node_id)&&options.includes(a.selected_option)&&options.includes(a.correct_option)&&typeof a.is_correct==='boolean'&&typeof a.explanation==='string';}

export function createLocalLearning(storage:StoragePort,key:string){
 function read():Records{
  let raw:string|null;
  try{raw=storage.getItem(key);}catch{throw new Error('浏览器无法读取本机学习记录，请允许本站存储。');}
  if(raw===null)return {version:1,tests:[],practice:[]};
  try{
   const r=JSON.parse(raw) as Records;
   if(r.version!==1||!Array.isArray(r.tests)||!Array.isArray(r.practice))throw Error();
   if(new Set(r.tests.map(t=>t.id)).size!==r.tests.length||r.tests.filter(t=>!t.result).length>1)throw Error();
   for(const t of r.tests){
    if(typeof t.id!=='string'||typeof t.started_at!=='string'||!(t.result===null||typeof t.result==='object')||!Array.isArray(t.snapshot)||t.snapshot.length!==6||!t.snapshot.every(validQuestion)||new Set(t.snapshot.map(q=>q.id)).size!==6||new Set(t.snapshot.map(q=>q.module)).size!==4)throw Error();
    if(t.result){const result=t.result;
     if(result.attempt_id!==t.id||!Array.isArray(result.answers)||result.answers.length!==6||!result.answers.every(validFeedback)||!Array.isArray(result.nodes)||result.nodes.length!==4)throw Error();
     if(result.total!==6||result.correct_count!==result.answers.filter(a=>a.is_correct).length||typeof t.submitted_at!=='string'||new Set(result.nodes.map(n=>n.node_id)).size!==4||!result.nodes.every(n=>modules.includes(n.node_id)&&['unassessed','unskilled','understood','familiar','mastered'].includes(n.level)))throw Error();
     for(const q of t.snapshot){const answer=result.answers.find(a=>a.question_id===q.id);if(!answer||answer.node_id!==q.module||answer.correct_option!==q.answer||answer.is_correct!==(answer.selected_option===q.answer))throw Error();}
    }
   }
   if(!r.practice.every(p=>typeof p.id==='string'&&typeof p.created_at==='string'&&p.question&&typeof p.question.stem==='string'&&Array.isArray(p.question.options)&&validFeedback(p.answer)))throw Error();
   return r;
  }catch{throw new Error('本机学习记录损坏或版本不兼容，未覆盖原记录。请保留浏览器数据以便检查。');}
 }
 function write(r:Records){try{storage.setItem(key,JSON.stringify(r));}catch{throw new Error('未能保存学习记录：浏览器存储不可用或空间不足。本次未提交成功，请处理后重试。');}}
 async function transaction<T>(operation:(r:Records)=>T):Promise<T>{
  const run=()=>{const r=read(),result=operation(r);write(r);return clone(result);};
  // No awaits inside the transaction; Web Locks also serialize supported tabs.
  if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request(key,async()=>run());
  return run();
 }
 return {
  async questions(node?:NodeId){return bank.filter(q=>!node||q.module===node).map(publicQuestion);},
  async levels(){return levels(read());},
  async history(){const r=read();return {tests:r.tests.map(view),practice:clone(r.practice)};},
  async current(){const tests=read().tests,t=tests[tests.length-1];return t?view(t):null;},
  async resume(id:string){const t=read().tests.find(t=>t.id===id);if(!t)throw new Error('未找到本机测试记录。');return view(t);},
  async start(){return transaction(r=>{
   const active=r.tests.find(t=>!t.result);if(active)return view(active);
   const chosen=modules.map(m=>shuffle(bank.filter(q=>q.module===m))[0]);
   chosen.push(...shuffle(bank.filter(q=>!chosen.some(c=>c.id===q.id))).slice(0,2));
   const t:SavedTest={id:randomId(),started_at:new Date().toISOString(),snapshot:clone(shuffle(chosen)),result:null};
   r.tests.push(t);return view(t);
  });},
  async check(questionId:string,selected:string,requestId:string){return transaction(r=>{
   const old=r.practice.find(p=>p.id===requestId);
   if(old){if(old.question.id!==questionId||old.answer.selected_option!==selected)throw new Error('这次练习已保存，请重新练习后再作答。');return old.answer;}
   const q=bank.find(q=>q.id===questionId);if(!q||!options.includes(selected)||!requestId)throw new Error('请选择本题有效选项。');
   const answer=feedback(q,selected);r.practice.push({id:requestId,created_at:new Date().toISOString(),question:publicQuestion(q),answer});return answer;
  });},
  async submit(id:string,answers:Record<string,string>){return transaction(r=>{
   const t=r.tests.find(t=>t.id===id);if(!t)throw new Error('未找到本机测试记录。');
   if(t.result)return t.result;
   if(Object.keys(answers).length!==6||!t.snapshot.every(q=>options.includes(answers[q.id])))throw new Error('请完成本轮全部6题后再提交。');
   const all=t.snapshot.map(q=>feedback(q,answers[q.id]));
   t.result={attempt_id:id,is_demo:false,correct_count:all.filter(a=>a.is_correct).length,total:6,answers:all,nodes:[]};
   t.submitted_at=new Date().toISOString();t.result.nodes=levels(r);return t.result;
  });},
  async mistakes():Promise<LocalMistake[]>{
   const r=read(),items:LocalMistake[]=[];
   for(const t of r.tests)for(const a of t.result?.answers??[])if(!a.is_correct)items.push({attempt_id:t.id,question:publicQuestion(t.snapshot.find(q=>q.id===a.question_id)!),answer:a,mode:'formal',created_at:t.submitted_at!});
   for(const p of r.practice)if(!p.answer.is_correct)items.push({attempt_id:p.id,question:p.question,answer:p.answer,mode:'practice',created_at:p.created_at});
   return clone(items.sort((a,b)=>b.created_at.localeCompare(a.created_at)));
  },
 };
}
