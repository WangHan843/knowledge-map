import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {learningApi} from '../lib/api';
import type {LocalMistake} from '../lib/local-learning';
import {QuestionCard} from '../components/QuestionCard';
import {Icon} from '../components/Icon';

export function Mistakes(){
 const [items,setItems]=useState<LocalMistake[]>([]),[module,setModule]=useState('all'),[mode,setMode]=useState('formal');
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;learningApi.mistakes().then(value=>{if(active){setItems(value);setError('');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoaded(true);});return()=>{active=false;};},[retry]);
 const visible=items.filter(m=>(module==='all'||m.question.node_id===module)&&m.mode===mode);
 return <div className="page quiz-page"><Link className="back-link" to="/"><Icon name="back" size={18}/>返回知识图谱</Link>
  <div className="quiz-heading"><div><div className="eyebrow">错题回顾 / 继续学习</div><h1>从错题找到复习方向</h1><p>保留每次原始作答。练习错题不影响学习等级。</p></div></div>
  <div className="mistake-filters"><label>记录来源<select value={mode} onChange={e=>setMode(e.target.value)}><option value="formal">正式测试</option><option value="practice">自主练习</option></select></label><label>知识模块<select value={module} onChange={e=>setModule(e.target.value)}><option value="all">全部模块</option>{['toa','tdoa','rss','aoa'].map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}</select></label></div>
  {error?<div className="error-box" role="alert">{error}<button onClick={()=>setRetry(v=>v+1)}>重新读取</button></div>:!loaded?<p role="status">正在读取本机错题…</p>:!visible.length?<section className="panel completion-card"><h2>此范围内还没有错题记录</h2><p>完成练习或正式测试后，答错的题目会保存在这里。</p><Link className="button primary" to={mode==='formal'?'/test':'/practice'}>{mode==='formal'?'进入正式测试':'开始练习'}</Link></section>:<><p className="small-muted">共 {visible.length} 次错答 · 仅保存在本浏览器</p>{visible.map((item,i)=><section className="panel review-card" key={item.attempt_id+':'+item.question.id}><p className="small-muted">{item.mode==='formal'?'正式测试':'自主练习'} · {new Date(item.created_at).toLocaleString('zh-CN')}</p><QuestionCard question={item.question} index={i} selected={item.answer.selected_option} feedback={item.answer} onSelect={()=>{}}/></section>)}</>}
 </div>;
}
