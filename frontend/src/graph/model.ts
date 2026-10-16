import {forceSimulation,forceLink,forceManyBody,forceCollide,forceX,forceY,type SimulationNodeDatum,type SimulationLinkDatum} from 'd3-force';
import {graphNodes,graphLinks,type GraphDefinition,type RelationDefinition} from '../data/graph-structure';
import type {NodeId} from '../types';
export const moduleColors:Record<NodeId,string>={toa:'#2868db',tdoa:'#087f93',rss:'#986620',aoa:'#6957b1'};
export interface GraphNode extends GraphDefinition,SimulationNodeDatum {x:number;y:number;ax:number;ay:number;width:number;}
export interface GraphLink extends Omit<RelationDefinition,'source'|'target'>,SimulationLinkDatum<GraphNode> {source:string|GraphNode;target:string|GraphNode;}
export interface Topology {nodes:GraphNode[];links:GraphLink[];}
const centers:Record<NodeId,[number,number]>={toa:[-110,-310],tdoa:[110,-310],rss:[-110,310],aoa:[110,310]};
export function createTopology():Topology {
  return {nodes:graphNodes.map(n=>{
    let x=0,y=0;
    if(n.methodId){[x,y]=centers[n.methodId];if(n.kind==='detail'){
      const index=Number(n.id.split('-')[1])-1;
      const angle=Math.atan2(y,x)+(index-1.5)*.95;
      x+=Math.cos(angle)*140;y+=Math.sin(angle)*140;
    }}
    return {...n,x,y,ax:x,ay:y,width:n.kind==='detail'?Math.max(110,n.title.length*15+26):90};
  }),links:graphLinks.map(l=>({...l}))};
}
export function createSimulation(graph:Topology){
  return forceSimulation(graph.nodes).stop().alphaDecay(.04).velocityDecay(.5)
    .force('link',forceLink<GraphNode,GraphLink>(graph.links).id(n=>n.id).distance(l=>l.type==='comparison'?270:l.source==='ROOT'||(l.source as GraphNode).id==='ROOT'?300:140).strength(l=>l.type==='comparison'?.025:.14))
    .force('charge',forceManyBody<GraphNode>().strength(-420))
    .force('collide',forceCollide<GraphNode>(n=>n.width/2+8).strength(.9).iterations(2))
    .force('x',forceX<GraphNode>(n=>n.ax).strength(.03))
    .force('y',forceY<GraphNode>(n=>n.ay).strength(.03));
}
