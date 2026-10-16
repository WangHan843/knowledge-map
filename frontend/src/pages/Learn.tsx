import {useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {graphNodes} from '../data/graph-structure';
import {LearningSheet} from '../components/LearningSheet';
import {TouchButton} from '../components/TouchButton';
import {Icon} from '../components/Icon';
import {useModuleLevels} from '../lib/use-module-levels';
import {levelLabels} from '../types';
import {NotFound} from './Reserved';

// Preserve practice/result URLs while sharing the graph's textbook content.
export function Learn(){
  const {nodeId}=useParams(),[selected,setSelected]=useState<string|null>(null),{levels}=useModuleLevels();
  const node=graphNodes.find(n=>n.kind==='module'&&n.methodId===nodeId);
  if(!node||!node.methodId)return <NotFound/>;
  return <div className="page reading-page">
    <Link className="back-link" to="/"><Icon name="back" size={18}/>返回知识图谱</Link>
    <nav className="node-tabs" aria-label="选择知识点">{graphNodes.filter(n=>n.kind==='module').map(n=><Link key={n.id} className={n.id===node.id?'active':''} aria-current={n.id===node.id?'page':undefined} to={`/learn/${n.methodId}`}>{n.title}</Link>)}</nav>
    <div className="lesson-heading"><div><div className="eyebrow">教材学习 · 定位方法</div><h1>{node.title} 知识点</h1></div><span className="level-pill">{levelLabels[levels[node.methodId]]}</span></div>
    <p>选择一个知识点，阅读教材原理、公式和对应原图。</p>
    <div className="concept-jumps">{graphNodes.filter(n=>n.parentId===node.id).map(n=><TouchButton key={n.id} onActivate={()=>setSelected(n.id)}>{n.title}<Icon name="arrow" size={18}/></TouchButton>)}</div>
    <div className="next-step"><p>阅读和练习不改变学习等级。</p><Link className="button primary" to={`/practice/${node.methodId}`}>练习这个模块</Link><Link className="text-link" to="/test">进入正式测试 →</Link></div>
    {selected&&<LearningSheet id={selected} onClose={()=>setSelected(null)} onSelect={setSelected}/>}
  </div>;
}
