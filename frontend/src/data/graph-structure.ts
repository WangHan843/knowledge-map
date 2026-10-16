import type { NodeId } from '../types';
export interface GraphDefinition {
  id: string; title: string; kind: 'center' | 'module' | 'detail';
  parentId?: string; methodId?: NodeId; contentId?: string; sourcePages: number[];
}
export interface RelationDefinition {
  id: string; source: string; target: string; type: 'hierarchy' | 'comparison';
  relationLabel: string; sourcePages: number[];
}
const modules: {id:NodeId;pages:number[];labels:string[]}[] = [
  {id:'toa',pages:[8,9],labels:['传播时间测距','收发时间同步','双信号与往返测距','三边定位']},
  {id:'tdoa',pages:[9],labels:['到达时间差','接收端时钟同步','距离差约束','双曲线定位']},
  {id:'rss',pages:[9,10,11],labels:['信号强度衰减','Friis传播方程','多径与环境影响','RSS指纹定位']},
  {id:'aoa',pages:[11],labels:['到达角测量','天线阵列','阵列时差与角度','多接收器交汇']},
];
// Navigation structure only: no lesson paragraphs, question IDs or assessment states.
export const graphNodes: GraphDefinition[] = [
  {id:'ROOT',title:'定位方法',kind:'center',sourcePages:[8]},
  ...modules.flatMap(m => [
    {id:m.id.toUpperCase(),title:m.id.toUpperCase(),kind:'module' as const,parentId:'ROOT',methodId:m.id,sourcePages:m.pages},
    ...m.labels.map((title,i) => ({id:`${m.id.toUpperCase()}-${i+1}`,title,kind:'detail' as const,parentId:m.id.toUpperCase(),methodId:m.id,contentId:`${m.id.toUpperCase()}-${i+1}`,sourcePages:m.id==='toa'?(i===3?[8,9]:[8]):m.id==='rss'?(i===3?[9,10,11]:i===2?[9,10]:[9]):m.pages})),
  ]),
];
export const graphLinks: RelationDefinition[] = [
  ...graphNodes.filter(n => n.parentId).map(n => ({id:`${n.parentId}/${n.id}`,source:n.parentId!,target:n.id,type:'hierarchy' as const,relationLabel:n.kind==='module'?'分类/包含':'包含知识点',sourcePages:n.sourcePages})),
  {id:'sync',source:'TOA-2',target:'TDOA-2',type:'comparison',relationLabel:'同步要求的比较',sourcePages:[8,9]},
  {id:'geometry',source:'TOA-4',target:'TDOA-4',type:'comparison',relationLabel:'几何定位方式比较',sourcePages:[9]},
];
