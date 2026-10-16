import {forceX,forceY} from 'd3-force';
import {createTopology,createSimulation,moduleColors,type GraphNode,type GraphLink} from './model';
import {GraphGestures,type Point} from './gestures';
import {levelLabels,type NodeId,type Level} from '../types';
const NS='http://www.w3.org/2000/svg';
const stateColors:Record<Level,string>={unassessed:'#7e8c9d',unskilled:'#c54848',familiar:'#2868db',understood:'#b97620',mastered:'#268258'};
const element=<T extends keyof SVGElementTagNameMap>(tag:T,attrs:Record<string,string|number>={})=>{
  const e=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,String(value));return e;
};
interface Options{onTap(id:string):void;onDrag(active:boolean):void;levels:Record<NodeId,Level>;}
export class GraphScene{
  private graph=createTopology();private simulation=createSimulation(this.graph);
  private svg=element('svg',{'aria-label':'全部21个节点的二维知识图谱'});private world=element('g');
  private nodeViews=new Map<string,SVGGElement>();private linkViews=new Map<string,SVGPathElement[]>();
  private scale=1;private minimumScale=.15;private tx=0;private ty=0;private width=1;private height=1;
  private frame=0;private lastFrame=0;private dirty=true;private disposed=false;private paused=false;
  private dragged?:GraphNode;private offset:Point={x:0,y:0};private events=new AbortController();private observer:ResizeObserver;private gestures:GraphGestures;
  constructor(private host:HTMLElement,private options:Options){
    this.simulation.tick(60);this.svg.append(this.world);this.host.append(this.svg);this.build();
    this.gestures=new GraphGestures({
      tap:id=>this.options.onTap(id),
      pan:(dx,dy)=>{this.tx+=dx;this.ty+=dy;this.wake();},
      transform:(previous,next,ratio)=>this.transform(previous,next,ratio),
      dragStart:(id,p)=>{this.dragged=this.graph.nodes.find(n=>n.id===id);if(!this.dragged)return;const w=this.toWorld(p);this.offset={x:this.dragged.x-w.x,y:this.dragged.y-w.y};this.dragged.fx=this.dragged.x;this.dragged.fy=this.dragged.y;this.host.dataset.dragging=id;this.options.onDrag(true);},
      dragMove:p=>{if(!this.dragged)return;const w=this.toWorld(p);this.dragged.x=this.dragged.fx=w.x+this.offset.x;this.dragged.y=this.dragged.fy=w.y+this.offset.y;this.simulation.alpha(.4);this.wake();},
      dragEnd:()=>{if(!this.dragged)return;this.dragged.ax=this.dragged.x;this.dragged.ay=this.dragged.y;this.dragged.fx=this.dragged.fy=null;this.dragged=undefined;delete this.host.dataset.dragging;this.options.onDrag(false);this.simulation.force('x',forceX<GraphNode>(n=>n.ax).strength(.018)).force('y',forceY<GraphNode>(n=>n.ay).strength(.018));this.simulation.alpha(.4);this.wake();},
    });
    const signal=this.events.signal;
    this.host.addEventListener('pointerdown',e=>{if(this.paused||e.button!==0)return;e.preventDefault();this.host.setPointerCapture(e.pointerId);const target=(e.target as Element).closest('[data-node],[data-relation]');const id=target?.getAttribute('data-node')??(target?.getAttribute('data-relation')?`relation:${target.getAttribute('data-relation')}`:undefined);this.gestures.down(e.pointerId,e,id);},{signal});
    this.host.addEventListener('pointermove',e=>{if(!this.paused){e.preventDefault();this.gestures.move(e.pointerId,e);}},{signal});
    this.host.addEventListener('pointerup',e=>{this.gestures.up(e.pointerId);if(this.host.hasPointerCapture(e.pointerId))this.host.releasePointerCapture(e.pointerId);},{signal});
    this.host.addEventListener('pointercancel',()=>this.gestures.cancel(),{signal});
    this.host.addEventListener('lostpointercapture',e=>this.gestures.up(e.pointerId),{signal});
    this.host.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
    this.host.addEventListener('wheel',e=>{if(this.paused)return;e.preventDefault();this.transform(e,e,Math.exp(-e.deltaY*.0015));},{signal,passive:false});
    const activate=(target:EventTarget|null)=>{const el=(target as Element).closest('[data-node],[data-relation]');const id=el?.getAttribute('data-node')??(el?.getAttribute('data-relation')?`relation:${el.getAttribute('data-relation')}`:null);if(id)this.options.onTap(id);};
    this.host.addEventListener('keydown',e=>{if(this.paused)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(e.target);}},{signal});
    this.host.addEventListener('click',e=>{if(!this.paused&&e.detail===0)activate(e.target);},{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.gestures.cancel();cancelAnimationFrame(this.frame);this.frame=0;this.host.dataset.renderState='hidden';}else this.wake();},{signal});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();this.fit();
  }
  private toWorld(p:Point):Point{const r=this.host.getBoundingClientRect();return{x:(p.x-r.left-this.tx)/this.scale,y:(p.y-r.top-this.ty)/this.scale};}
  private transform(previous:Point,next:Point,ratio:number){
    const rect=this.host.getBoundingClientRect();const s=Math.max(this.minimumScale,Math.min(3,this.scale*ratio));const actual=s/this.scale;
    this.tx=next.x-rect.left-(previous.x-rect.left-this.tx)*actual;this.ty=next.y-rect.top-(previous.y-rect.top-this.ty)*actual;this.scale=s;this.wake();
  }
  zoom(factor:number){const r=this.host.getBoundingClientRect();const c={x:r.left+this.width/2,y:r.top+this.height/2};this.transform(c,c,factor);}
  private resize(){const oldW=this.width,oldH=this.height;this.width=Math.max(1,this.host.clientWidth);this.height=Math.max(1,this.host.clientHeight);this.svg.setAttribute('viewBox',`0 0 ${this.width} ${this.height}`);if(oldW===1)this.fit();else{this.tx+=(this.width-oldW)/2;this.ty+=(this.height-oldH)/2;this.wake();}}
  fit(){
    const xs=this.graph.nodes.map(n=>n.x),ys=this.graph.nodes.map(n=>n.y);const minX=Math.min(...xs)-105,maxX=Math.max(...xs)+105,minY=Math.min(...ys)-80,maxY=Math.max(...ys)+90;
    this.scale=Math.min(1,Math.max(1,this.width-24)/(maxX-minX),Math.max(1,this.height-72)/(maxY-minY));
    this.minimumScale=Math.min(.15,this.scale);
    this.tx=this.width/2-(minX+maxX)/2*this.scale;this.ty=this.height/2-(minY+maxY)/2*this.scale;this.wake();
  }
  setLevels(levels:Record<NodeId,Level>){this.options.levels=levels;this.wake();}
  setPaused(paused:boolean){this.paused=paused;if(paused){this.gestures.cancel();cancelAnimationFrame(this.frame);this.frame=0;this.host.dataset.renderState='paused';}else this.wake();}
  private build(){
    for(const link of this.graph.links){
      const path=element('path',{class:link.type==='comparison'?'comparison-line':'hierarchy-line','vector-effect':'non-scaling-stroke','data-edge':link.id});this.world.append(path);const paths=[path];
      if(link.type==='comparison'){
        const hit=element('path',{class:'comparison-hit','vector-effect':'non-scaling-stroke','data-relation':link.id,role:'button',tabindex:0,'aria-label':link.relationLabel});
        const title=element('title');title.textContent=`${link.relationLabel} · PDF第${link.sourcePages.join('、')}页`;hit.append(title);this.world.append(hit);paths.push(hit);
      }
      this.linkViews.set(link.id,paths);
    }
    for(const n of this.graph.nodes){
      const group=element('g',{'data-node':n.id,'data-kind':n.kind,role:'button',tabindex:0,'aria-label':n.kind==='detail'?`学习${n.title}`:`${n.title}概览`,class:`force-node force-node-${n.kind}`});
      const color=n.methodId?moduleColors[n.methodId]:'#315c91';group.style.setProperty('--branch-color',color);
      group.append(element('circle',{r:n.kind==='center'?70:n.kind==='module'?42:18}));
      const title=element('text',{'text-anchor':'middle','dominant-baseline':'central',class:'force-label'});title.textContent=n.title;group.append(title);
      if(n.kind==='module'){const state=element('text',{'text-anchor':'middle',class:'force-level'});group.append(state);}
      this.nodeViews.set(n.id,group);this.world.append(group);
    }
    this.host.dataset.nodeCount=String(this.graph.nodes.length);this.host.dataset.edgeCount=String(this.graph.links.length);
  }
  private linkPath(l:GraphLink){const a=l.source as GraphNode,b=l.target as GraphNode;if(l.type==='hierarchy')return`M${a.x},${a.y}L${b.x},${b.y}`;return`M${a.x},${a.y}Q${(a.x+b.x)/2},${(a.y+b.y)/2+(l.id==='sync'?-90:90)} ${b.x},${b.y}`;}
  private wake(){this.dirty=true;if(!this.frame&&!this.paused&&!document.hidden&&!this.disposed)this.frame=requestAnimationFrame(this.render);}
  private render=(now:number)=>{
    this.frame=0;if(this.disposed||this.paused||document.hidden)return;
    if(now-this.lastFrame<32){this.frame=requestAnimationFrame(this.render);return;}this.lastFrame=now;
    const active=this.simulation.alpha()>this.simulation.alphaMin();if(active)this.simulation.tick(2);
    if(active||this.dirty){
      this.world.setAttribute('transform',`translate(${this.tx},${this.ty}) scale(${this.scale})`);
      for(const n of this.graph.nodes){
        const g=this.nodeViews.get(n.id)!;g.setAttribute('transform',`translate(${n.x},${n.y})`);g.dataset.position=`${n.x.toFixed(2)},${n.y.toFixed(2)}`;
        const radius=Math.max(n.kind==='center'?70:n.kind==='module'?42:18,(n.kind==='center'?28:n.kind==='module'?16:5)/this.scale);
        const circle=g.querySelector('circle')!,label=g.querySelector('text')!;
        circle.setAttribute('r',String(radius));
        label.setAttribute('font-size',String(n.kind==='detail'?26:n.kind==='center'?14/this.scale:12/this.scale));
        label.setAttribute('y',String(n.kind==='detail'?radius+24:0));
        if(n.kind==='module'){
          const level=this.options.levels[n.methodId!],state=g.querySelector<SVGTextElement>('.force-level')!;
          state.dataset.level=level;state.textContent=levelLabels[level];state.setAttribute('y',String(radius+15/this.scale));
          state.setAttribute('font-size',String(10/this.scale));state.setAttribute('fill',stateColors[level]);
          g.style.setProperty('--level-color',stateColors[level]);circle.style.fill=`${stateColors[level]}1a`;
          g.setAttribute('aria-label',`${n.title}，${levelLabels[level]}，打开模块概览`);
        }
      }
      for(const l of this.graph.links)for(const p of this.linkViews.get(l.id)!)p.setAttribute('d',this.linkPath(l));
      this.host.dataset.view=`${this.scale.toFixed(5)},${this.tx.toFixed(3)},${this.ty.toFixed(3)}`;this.dirty=false;
    }
    this.host.dataset.renderState=active?'settling':'idle';if(active)this.frame=requestAnimationFrame(this.render);
  };
  dispose(){this.disposed=true;this.gestures.cancel();cancelAnimationFrame(this.frame);this.simulation.stop();this.observer.disconnect();this.events.abort();this.host.replaceChildren();}
}
