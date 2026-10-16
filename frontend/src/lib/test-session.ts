import {storedStudent} from './student-session';
import {draftPrefix as KEY} from './runtime';
export const draftKey=(id:string)=>KEY+':'+id;
interface TestDraft {id:string;student_id:string;answers:Record<string,string>;index:number;}
export function readDraft(id:string):TestDraft|null{
  try{
    const value=JSON.parse(localStorage.getItem(draftKey(id))??'null');
    if(!value||value.id!==id||value.student_id!==storedStudent()?.student_id)return null;
    const answers=Object.fromEntries(Object.entries(value.answers??{}).filter((entry):entry is [string,string]=>typeof entry[1]==='string'&&/^[ABCD]$/.test(entry[1])));
    return {...value,answers,index:Number.isInteger(value.index)?Math.max(0,value.index):0};
  }catch{return null;}
}
export function saveDraft(id:string,answers:Record<string,string>,index:number):boolean{
  // Callers pass answer changes only. Navigation must not overwrite another tab.
  try{localStorage.setItem(draftKey(id),JSON.stringify({id,student_id:storedStudent()?.student_id,answers:{...readDraft(id)?.answers,...answers},index}));return true;}catch{return false;}
}

