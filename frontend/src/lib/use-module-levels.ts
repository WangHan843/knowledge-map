import {useEffect,useState} from 'react';
import {learningApi} from './api';
import type {NodeId,Level} from '../types';
// Assessment data stays separate from the textbook graph structure.
export function useModuleLevels(){
  const [levels,setLevels]=useState<Record<NodeId,Level>>({toa:'unassessed',tdoa:'unassessed',rss:'unassessed',aoa:'unassessed'});
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    const refresh=()=>learningApi.levels().then(nodes=>{if(active){setLevels(Object.fromEntries(nodes.map(n=>[n.node_id,n.level])) as Record<NodeId,Level>);setError('');}}).catch(()=>{if(active)setError('累计评价暂时无法读取，当前等级可能不是最新；图谱仍可学习。');});
    const visible=()=>{if(document.visibilityState==='visible')void refresh();};
    void refresh();window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
    return()=>{active=false;window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible);};
  },[]);
  return{levels,error};
}

