import {isStatic,studentKey as KEY} from './runtime';
export interface StudentSession {student_id:string;token:string;}
let pending:Promise<StudentSession>|null=null;
let registered='';
const randomHex=(bytes:number)=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),v=>v.toString(16).padStart(2,'0')).join('');
export function storedStudent():StudentSession|null{
  const raw=localStorage.getItem(KEY);
  if(!raw)return null;
  try{const s=JSON.parse(raw);if(/^[a-f0-9]{32}$/.test(s.student_id)&&/^[a-f0-9]{64}$/.test(s.token))return s;}catch{/* keep invalid data for recovery */}
  throw new Error('本机匿名记录格式有误，未覆盖原记录。请检查浏览器存储。');
}
export async function ensureStudent():Promise<StudentSession>{
  if(pending)return pending;
  pending=(async()=>{
    let session:StudentSession;
    try{
      session=storedStudent()??{student_id:randomHex(16),token:randomHex(32)};
      localStorage.setItem(KEY,JSON.stringify(session));
    }catch(e){throw new Error(e instanceof Error&&e.message.includes('未覆盖')?e.message:'浏览器无法保存匿名学习记录，请允许本站本地存储后重试。');}
    if(isStatic||registered===session.token)return session;
    let response:Response;
    try{response=await fetch('/api/students',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session)});}catch{throw new Error('无法连接学习服务，请检查网络后重试。');}
    if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(typeof error.detail==='string'?error.detail:'暂时无法建立匿名记录，请重试。');}
    registered=session.token;return session;
  })();
  try{return await pending;}finally{pending=null;}
}
