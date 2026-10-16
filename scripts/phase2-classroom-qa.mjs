import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const require=createRequire(new URL('../frontend/package.json',import.meta.url));
const {chromium}=require('playwright');
// Run against an isolated QA database/server, never the classroom database.
const base=process.env.QA_URL??'http://localhost:8001';
const bank=JSON.parse(await readFile(new URL('../backend/app/questions.json',import.meta.url),'utf8'));
const key=Object.fromEntries(bank.map(q=>[q.id,q.answer]));
const labels={unskilled:'不熟练',understood:'了解',familiar:'熟悉',mastered:'掌握',unassessed:'未测评'};
const browser=await chromium.launch({headless:true});
const results=[];
await mkdir(new URL('../output/phase2/',import.meta.url),{recursive:true});
try{for(const [width,height] of [[375,812],[390,844],[430,932]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 try{
  await page.goto(base);await page.locator('.force-stage[data-render-state="idle"]').waitFor();
  await page.waitForFunction(()=>!!localStorage.getItem('positioning-student-v1'));
  const identity=await page.evaluate(()=>JSON.parse(localStorage.getItem('positioning-student-v1')));
  const headers={Authorization:'Bearer '+identity.token};
  const levels=async()=>(await context.request.get(base+'/api/levels',{headers})).json();
  assert((await levels()).every(n=>n.level==='unassessed'));
  // Enter a module from the graph; follow a concept into practice.
  await page.locator('[data-node="TOA"] > circle').tap();
  await page.locator('.concept-jumps button').first().tap();
  await page.getByRole('link',{name:'练习 TOA 模块',exact:true}).tap();
  await page.locator('.answer-option').first().tap();
  await page.getByRole('button',{name:'确认答案',exact:true}).tap();
  await page.locator('.answer-feedback').waitFor();
  assert((await page.locator('.answer-feedback').innerText()).includes('教材来源'));
  assert((await levels()).every(n=>n.level==='unassessed'));
  await page.locator('.mobile-nav').getByRole('link',{name:'正式测试',exact:true}).tap();
  const started=page.waitForResponse(r=>r.url()===base+'/api/attempts'&&r.request().method()==='POST');
  await page.getByRole('button',{name:'开始6题测试',exact:true}).tap();
  let attempt=await (await started).json();
  // A second tab opened before the first answer must not erase that answer.
  if(width===390){
   const duplicate=await context.newPage();await duplicate.goto(base+'/test');
   await duplicate.locator('.question-nav button').first().waitFor();
   const first=attempt.questions[0];
   await page.locator(`input[name="${first.id}"][value="A"]`).check();
   await duplicate.getByRole('button',{name:'下一题',exact:true}).tap();
   await page.reload();
   await page.getByRole('button',{name:/第 1 题/}).tap();
   assert(await page.locator(`input[name="${first.id}"][value="A"]`).isChecked());
   await duplicate.close();
  }
  const counts=Object.fromEntries(['toa','tdoa','rss','aoa'].map(m=>[m,{correct:0,total:0}]));
  for(let round=0;round<2;round++){
   assert.equal(attempt.questions.length,6);assert.equal(new Set(attempt.questions.map(q=>q.id)).size,6);
   assert.equal(new Set(attempt.questions.map(q=>q.node_id)).size,4);
   assert(attempt.questions.every(q=>!('answer' in q)&&!('explanation' in q)));
   await page.getByRole('button',{name:/第 6 题/}).tap();
   assert(await page.getByRole('button',{name:'提交测试答卷',exact:true}).isDisabled());
   for(let i=0;i<6;i++){
    const q=attempt.questions[i],correct=round===0?q.node_id!=='toa':q.node_id==='toa';
    const option=correct?key[q.id]:'ABCD'.split('').find(o=>o!==key[q.id]);
    await page.getByRole('button',{name:new RegExp(`第 ${i+1} 题`)}).tap();
    await page.locator(`input[name="${q.id}"][value="${option}"]`).check();
    counts[q.node_id].total++;counts[q.node_id].correct+=Number(correct);
    if(i===2){await page.reload();await page.locator(`input[name="${q.id}"][value="${option}"]:checked`).waitFor();}
   }
   const submitted=page.waitForResponse(r=>r.url().endsWith('/submit')&&r.request().method()==='POST');
   await page.getByRole('button',{name:'提交测试答卷',exact:true}).tap();
   const result=await (await submitted).json();await page.getByRole('heading',{name:'本轮测试已保存',exact:true}).waitFor();
   assert.equal(await page.locator('.review-card').count(),6);
   const expected=Object.entries(counts).map(([node_id,n])=>({node_id,level:n.correct*5<n.total*2?'unskilled':n.correct*5<n.total*3?'understood':n.correct*5<n.total*4?'familiar':'mastered'}));
   assert.deepEqual(result.nodes,expected);assert.deepEqual(await levels(),expected);
   await page.reload();await page.getByRole('heading',{name:'本轮测试已保存',exact:true}).waitFor();
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('positioning-student-v1'))),identity);
   if(round===0){
    await page.getByRole('link',{name:'返回知识图谱查看状态',exact:true}).tap();await page.locator('.force-stage[data-render-state="idle"]').waitFor();
    for(const n of expected)assert.equal(await page.locator(`[data-node="${n.node_id.toUpperCase()}"] .force-level`).textContent(),labels[n.level]);
    const strokes=await page.locator('.force-node-module circle').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).stroke));
    assert.equal(new Set(strokes).size,2,'Unskilled and mastered nodes must have different circle colors');
    assert.equal(await page.locator('.force-node-detail .force-level').count(),0);
    await page.screenshot({path:`D:/knowledge-map/output/phase2/${width}-graded-graph.png`});
    await page.locator('[data-node="TOA"] > circle').tap();
    await page.locator('.concept-jumps button').first().tap();await page.getByRole('dialog').waitFor();
    await page.getByRole('link',{name:/进入正式测试/}).tap();
    const next=page.waitForResponse(r=>r.url()===base+'/api/attempts'&&r.request().method()==='POST');
    await page.getByRole('button',{name:'再测试一轮',exact:true}).tap();attempt=await (await next).json();
   }
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  await page.screenshot({path:`D:/knowledge-map/output/phase2/${width}-formal-result.png`});
  results.push({width,height,checks:['graph → concept → practice','practice never grades','6 unique questions covering 4 modules','no answers at start','draft reload recovery','backend scoring and explanations','original result reload','2 tests accumulate by answers','graph updates module levels only','weak module → textbook → new test','no horizontal overflow or page errors']});
  console.log(`${width}: classroom flow passed`);
 }catch(e){await page.screenshot({path:`D:/knowledge-map/output/phase2/${width}-classroom-failure.png`});throw e;}finally{await context.close();}
}}finally{await browser.close();}
await writeFile(new URL('../output/phase2/classroom-results.json',import.meta.url),JSON.stringify(results,null,2));
