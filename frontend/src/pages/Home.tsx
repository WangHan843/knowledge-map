import {useCallback,useState} from 'react';
import {KnowledgeGraph} from '../components/KnowledgeGraph';
import {LearningSheet} from '../components/LearningSheet';
import {useModuleLevels} from '../lib/use-module-levels';
import '../graph/mobile.css';
export function Home(){
  const [selected,setSelected]=useState<string|null>(null);const close=useCallback(()=>setSelected(null),[]);const {levels,error}=useModuleLevels();
  return <div className="graph-home"><KnowledgeGraph paused={!!selected} onNode={setSelected} levels={levels}/>{error&&<p className="assessment-note" role="status">{error}</p>}{selected&&<LearningSheet id={selected} onClose={close} onSelect={setSelected}/>}</div>;
}
