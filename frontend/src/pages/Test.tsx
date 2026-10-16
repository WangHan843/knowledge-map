import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Icon} from '../components/Icon';
import {QuestionCard,QuestionNav} from '../components/QuestionCard';
import {learningApi} from '../lib/api';
import {readDraft,saveDraft,draftKey} from '../lib/test-session';
import {isStatic} from '../lib/runtime';
import {levelLabels,type Attempt} from '../types';

export function Test(){
  const [attempt,setAttempt]=useState<Attempt|null>(null);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [index,setIndex]=useState(0),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const [error,setError]=useState(''),[storageWarning,setStorageWarning]=useState(false),[retry,setRetry]=useState(0);
  function restore(data:Attempt|null){
    setAttempt(data);
    const draft=data?readDraft(data.id):null;
    setAnswers(draft?Object.fromEntries(Object.entries(draft.answers).filter(([id])=>data!.questions.some(q=>q.id===id))):{});
    setIndex(data?Math.min(draft?.index??0,data.questions.length-1):0);
  }
  useEffect(()=>{
    let active=true;setLoading(true);
    learningApi.current().then(data=>{if(active){restore(data);setError('');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[retry]);
  useEffect(()=>{
    if(!attempt||attempt.result)return;
    const synchronize=(e:StorageEvent)=>{if(e.key===draftKey(attempt.id)){const draft=readDraft(attempt.id);if(draft)setAnswers(draft.answers);}};
    window.addEventListener('storage',synchronize);return()=>window.removeEventListener('storage',synchronize);
  },[attempt]);
  function persist(next:Record<string,string>,position:number){if(attempt)setStorageWarning(!saveDraft(attempt.id,next,position));}
  async function start(){
    if(busy)return;setBusy(true);setError('');
    try{const data=await learningApi.start();restore(data);if(!readDraft(data.id))setStorageWarning(!saveDraft(data.id,{},0));}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function submit(){
    if(!attempt||busy||!attempt.questions.every(q=>answers[q.id]))return;
    setBusy(true);setError('');
    try{const result=await learningApi.submit(attempt.id,answers);setAttempt({...attempt,result});window.scrollTo({top:0,behavior:'instant'});}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function changeIndex(next:number){if(!busy){setIndex(next);persist({},next);}}
  const count=attempt?.questions.filter(q=>answers[q.id]).length??0,q=attempt?.questions[index],result=attempt?.result;
  return <div className="page quiz-page">
    <Link className="back-link" to="/"><Icon name="back" size={18}/>返回知识图谱</Link>
    <div className="quiz-heading"><div><div className="eyebrow">正式测试 / 累计评价</div><h1>{result?'本轮测试反馈':'给刚学过的知识，一次检验'}</h1><p>随机6题 · 覆盖四个模块 · 提交后更新累计等级</p></div>
      {attempt&&!result&&<div className="progress-summary"><span>已作答 <strong>{count} / {attempt.questions.length}</strong></span><progress aria-label="测试作答进度" value={count} max={attempt.questions.length}/></div>}
    </div>
    {error&&<div className="error-box" role="alert">{error}{!attempt&&<button onClick={()=>setRetry(v=>v+1)}>重新读取记录</button>}</div>}
    {storageWarning&&<div className="error-box" role="status">未能保存本机答题草稿，请保持本页打开直到提交。</div>}
    {loading?<div className="panel loading-state" role="status">正在读取学习记录…</div>:result&&attempt?<>
      <section className="panel result-summary"><span className="completion-icon"><Icon name="check" size={30}/></span><div><h2>本轮测试已保存</h2><p>本次答对 <strong>{result.correct_count}</strong> / {result.total} 题。</p><span className="small-muted">下面显示本轮提交时的累计等级。返回图谱可查看最新评价。</span></div></section>
      <section className="panel cumulative-feedback" aria-label="累计学习评价"><h2>从薄弱模块继续学习</h2><div className="module-results">{result.nodes.map(n=><Link to={'/learn/'+n.node_id} key={n.node_id}><strong>{n.node_id.toUpperCase()}</strong><span className={'level-pill level-'+n.level}>{levelLabels[n.level]}</span><span>{n.level==='mastered'?'巩固学习':'继续学习'} →</span></Link>)}</div><Link className="button secondary" to="/">返回知识图谱查看状态</Link></section>
      <div className="section-heading result-heading"><h2>回顾作答与解析</h2>{isStatic?<Link to="/mistakes">查看历史错题 →</Link>:<span>教材题库 · 已保存原始作答</span>}</div>
      {attempt.questions.map((question,i)=>{const feedback=result.answers.find(a=>a.question_id===question.id)!;return <section className="panel review-card" key={question.id}><QuestionCard question={question} index={i} selected={feedback.selected_option} feedback={feedback} onSelect={()=>{}}/></section>;})}
      <div className="result-actions"><Link className="button secondary" to="/">返回知识图谱</Link><button className="button primary" onClick={start} disabled={busy}>{busy?'准备中…':'再测试一轮'}<Icon name="arrow" size={18}/></button></div>
    </>:attempt&&q?<>
      <div className="inline-note"><Icon name="info" size={17}/>答题期间不显示解析，完成全部6题后统一提交。</div>
      <section className="panel quiz-panel"><QuestionCard question={q} index={index} selected={answers[q.id]} disabled={busy} onSelect={option=>{const next={...answers,[q.id]:option};setAnswers(next);persist({[q.id]:option},index);setError('');}}/>
        <div className="quiz-actions"><button className="button secondary" disabled={index===0||busy} onClick={()=>changeIndex(index-1)}><Icon name="back" size={18}/>上一题</button>{index<attempt.questions.length-1?<button className="button primary" disabled={busy} onClick={()=>changeIndex(index+1)}>下一题<Icon name="arrow" size={18}/></button>:<button className="button primary" disabled={count!==attempt.questions.length||busy} onClick={submit}>{busy?'提交中…':'提交测试答卷'}<Icon name="check" size={18}/></button>}</div>
      </section>
      <QuestionNav questions={attempt.questions} index={index} answers={answers} onChange={changeIndex}/>
      <div className="quiz-tip"><Icon name="info" size={16}/>{index===attempt.questions.length-1&&count<attempt.questions.length?'还有 '+(attempt.questions.length-count)+' 题未作答，点击题号补充。':'可通过题号修改答案。刷新后恢复本机答题进度。'}</div>
    </>:<section className="panel test-intro"><div className="intro-illustration"><Icon name="edit" size={44}/><span>TOA · TDOA · RSS · AOA</span></div><h2>检验所学，找到下一步方向</h2><p>从20道教材题目中随机抽取6题，至少覆盖每个模块一次。全部完成后查看答案与解析。</p><ul className="test-rules"><li><span>题目</span><strong>6道随机单选题</strong></li><li><span>反馈</span><strong>全部提交后查看</strong></li><li><span>评价</span><strong>累计正式作答更新等级</strong></li></ul><button className="button primary" disabled={busy||!!error} onClick={start}>{busy?'准备题目…':'开始6题测试'}<Icon name="arrow" size={19}/></button><div className="intro-footnote">无需姓名或学号。请使用同一浏览器继续学习；清除浏览器数据或更换访问地址将无法访问原匿名记录。</div></section>}
  </div>;
}

