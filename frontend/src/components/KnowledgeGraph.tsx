import {useEffect,useRef,useState} from 'react';
import type {GraphScene} from '../graph/scene';
import type {NodeId,Level} from '../types';
import {Icon} from './Icon';
import {TouchButton} from './TouchButton';
interface Props{paused:boolean;onNode(id:string):void;levels:Record<NodeId,Level>;}
export function KnowledgeGraph({paused,onNode,levels}:Props){
  const host=useRef<HTMLDivElement>(null),engine=useRef<GraphScene|null>(null);const latest=useRef({paused,onNode,levels});latest.current={paused,onNode,levels};
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(false),[dragging,setDragging]=useState(false),[retry,setRetry]=useState(0),[exploring,setExploring]=useState(false);
  useEffect(()=>{let cancelled=false;setReady(false);setError('');import('../graph/scene').then(({GraphScene})=>{if(cancelled||!host.current)return;engine.current=new GraphScene(host.current,{onTap:id=>latest.current.onNode(id),onDrag:setDragging,levels:latest.current.levels});engine.current.setPaused(latest.current.paused);setReady(true);}).catch(()=>{if(!cancelled)setError('图谱加载失败，请重新加载。');});return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};},[retry]);
  useEffect(()=>{document.body.classList.toggle('graph-exploring',exploring);return()=>document.body.classList.remove('graph-exploring');},[exploring]);
  useEffect(()=>engine.current?.setPaused(paused),[paused]);useEffect(()=>engine.current?.setLevels(levels),[levels]);
  return <section className={`mobile-graph${exploring?' is-exploring':''}`} aria-label="定位方法二维力导向知识图谱">
    <div className="graph-topline"><div><span className="graph-kicker">物联网与云计算 · 定位技术</span><h1>定位方法</h1><p className="graph-count">探索 4 种方法与 16 个知识点</p></div><TouchButton className="explore-toggle" onActivate={()=>setExploring(!exploring)} aria-pressed={exploring}>{exploring?'退出探索模式':'图谱探索模式'}</TouchButton></div>
    <div className="force-stage" ref={host} aria-label="二维图谱触控区域" inert={!!error}/>
    {!ready&&!error&&<div className="graph-loading" role="status">正在整理知识图谱…</div>}
    {error&&<div className="graph-error" role="alert"><p>{error}</p><TouchButton className="button primary" onActivate={()=>setRetry(n=>n+1)}>重新加载图谱</TouchButton></div>}
    {help&&<div className="graph-help"><strong>用手指探索知识网络</strong><p>拖动节点：移动知识点<br/>拖动空白：平移画布<br/>双指捏合：缩放 · 双指同向移动：平移</p><p>点击小节点阅读教材。点击大节点查看模块概览，所有节点始终保留。</p><small>实线表示层级，淡虚线表示教材支持的比较关系。放大后可清晰阅读小节点名称。</small><TouchButton onActivate={()=>setHelp(false)}>知道了</TouchButton></div>}
    <div className="force-controls" aria-label="图谱视图控制"><TouchButton onActivate={()=>engine.current?.zoom(1.5)} disabled={!ready} aria-label="放大图谱">＋</TouchButton><TouchButton onActivate={()=>engine.current?.zoom(1/1.5)} disabled={!ready} aria-label="缩小图谱">−</TouchButton><TouchButton onActivate={()=>engine.current?.fit()} disabled={!ready} aria-label="适应全部节点"><Icon name="target" size={19}/></TouchButton><TouchButton onActivate={()=>setHelp(!help)} aria-expanded={help} aria-label="查看图谱操作说明"><Icon name="info" size={19}/></TouchButton></div>
    <div className="force-bottom"><p aria-live="polite">{dragging?'松手后，节点将平滑回到力平衡':'拖动节点 · 空白平移 · 双指缩放'}</p><div className="comparison-entries"><span>虚线比较</span><TouchButton onActivate={()=>onNode('relation:sync')}>同步要求</TouchButton><TouchButton onActivate={()=>onNode('relation:geometry')}>几何定位</TouchButton></div></div>
  </section>;
}
