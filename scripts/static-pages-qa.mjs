import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {serveStatic} from './serve-static.mjs';
const require=createRequire(new URL('../frontend/package.json',import.meta.url));
const {chromium}=require('playwright');
const html=await readFile(new URL('../frontend/dist/index.html',import.meta.url),'utf8');
const base=html.match(/src="([^"]*)assets\//)?.[1]??'/';
const server=await serveStatic({port:0,base}),url=`http://127.0.0.1:${server.address().port}${base}`;
const bank=JSON.parse(await readFile(new URL('../frontend/src/data/questions.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true}),results=[];
await mkdir(new URL('../output/static-pages/',import.meta.url),{recursive:true});
try{for(const [width,height] of [[375,812],[390,844],[430,932]]){
 let context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
 let page=await context.newPage();const errors=[],apiCalls=[];
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});p.on('request',r=>{if(new URL(r.url()).pathname.includes('/api/'))apiCalls.push(r.url());});};watch(page);
 const records=()=>page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.includes(':records:'));return k?JSON.parse(localStorage.getItem(k)):null;});
 try{
  await page.goto(url);await page.locator('.force-stage[data-render-state="idle"]').waitFor();
  assert.equal(await page.locator('[data-node]').count(),21);
  await page.getByRole('button',{name:'图谱探索模式',exact:true}).tap();assert.equal(await page.locator('.mobile-nav').isVisible(),false);
  await page.getByRole('button',{name:'退出探索模式',exact:true}).tap();
  await page.locator('.mobile-nav').getByRole('link',{name:'自主练习',exact:true}).tap();
  await page.locator('input[type=radio]').first().waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'20-question navigation must wrap on mobile');
  let qid=await page.locator('input[type=radio]').first().getAttribute('name');
  const wrong=id=>'ABCD'.split('').find(o=>o!==bank.find(q=>q.id===id).answer);
  await page.locator(`input[value="${wrong(qid)}"]`).check();await page.getByRole('button',{name:'确认答案',exact:true}).tap();
  await page.locator('.answer-feedback').waitFor();assert.equal((await records()).practice.length,1);
  await page.locator('.mobile-nav').getByRole('link',{name:'知识图谱',exact:true}).tap();await page.locator('.force-level[data-level="unassessed"]').first().waitFor();assert.equal(await page.locator('.force-level[data-level="unassessed"]').count(),4);
  await page.locator('.mobile-nav').getByRole('link',{name:'正式测试',exact:true}).tap();await page.getByRole('button',{name:'开始6题测试',exact:true}).tap();
  let firstId;
  for(let round=0;round<2;round++){
   await page.locator('.question-nav button').first().waitFor();const current=(await records()).tests.at(-1);
   if(round===0)firstId=current.id;
   assert.equal(current.snapshot.length,6);assert.equal(new Set(current.snapshot.map(q=>q.module)).size,4);
   assert.equal(new Set(current.snapshot.map(q=>q.id)).size,6);
   for(let i=0;i<6;i++){
    await page.getByRole('button',{name:new RegExp(`第 ${i+1} 题`)}).tap();qid=current.snapshot[i].id;
    const choice=round===0?wrong(qid):bank.find(q=>q.id===qid).answer;
    await page.locator(`input[name="${qid}"][value="${choice}"]`).check();
    if(i===2){await page.reload();await page.locator(`input[name="${qid}"][value="${choice}"]:checked`).waitFor();assert.equal((await records()).tests.at(-1).id,current.id);}
   }
   await page.getByRole('button',{name:'提交测试答卷',exact:true}).tap();await page.getByRole('heading',{name:'本轮测试已保存',exact:true}).waitFor();
   assert.equal((await records()).tests.length,round+1);assert.equal((await records()).tests.at(-1).result.correct_count,round===0?0:6);
   if(round===0){await page.getByRole('button',{name:'再测试一轮',exact:true}).tap();}
  }
  const saved=await records();assert.equal(saved.tests[0].id,firstId);assert(saved.tests[0].result.answers.every(a=>!a.is_correct));
  await page.getByRole('link',{name:'返回知识图谱查看状态',exact:true}).tap();await page.locator('.force-stage[data-render-state="idle"]').waitFor();
  for(const module of ['toa','tdoa','rss','aoa']){
   const a=saved.tests.flatMap(t=>t.result.answers).filter(a=>a.node_id===module),correct=a.filter(a=>a.is_correct).length;
   const level=correct*5<a.length*2?'unskilled':correct*5<a.length*3?'understood':correct*5<a.length*4?'familiar':'mastered';
   assert.equal(await page.locator(`[data-node="${module.toUpperCase()}"] .force-level`).getAttribute('data-level'),level);
  }
  await page.screenshot({path:`D:/knowledge-map/output/static-pages/${width}-graph.png`});
  await page.locator('.mobile-nav').getByRole('link',{name:'我的错题',exact:true}).tap();await page.locator('.review-card').first().waitFor();assert.equal(await page.locator('.review-card').count(),6);
  await page.getByLabel('知识模块').selectOption('toa');assert.equal(await page.locator('.review-card').count(),saved.tests[0].snapshot.filter(q=>q.module==='toa').length);
  await page.getByLabel('知识模块').selectOption('all');await page.getByLabel('记录来源').selectOption('practice');assert.equal(await page.locator('.review-card').count(),1);
  await page.locator('.answer-feedback a').first().tap();await page.locator('.concept-jumps button').first().tap();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'关闭知识内容'}).tap();
  // A new context with the same browser profile data can open a hash deep link.
  const state=await context.storageState();await context.close();context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,storageState:state});page=await context.newPage();watch(page);
  await page.goto(url+'#/mistakes');await page.locator('.review-card').first().waitFor();assert.equal(await page.locator('.review-card').count(),6);
  await page.reload();await page.locator('.review-card').first().waitFor();assert.deepEqual(await records(),saved);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(apiCalls,[]);assert.deepEqual(errors,[]);
  await page.screenshot({path:`D:/knowledge-map/output/static-pages/${width}-mistakes.png`});
  results.push({width,height,base,apiRequests:0,checks:['21-node graph and exploration','practice stored without grading','6 unique questions covering 4 modules','draft reload','two cumulative tests','original answers retained','module feedback','formal/practice mistakes and filters','return to textbook','profile reopen and hash reload','no API or resource errors']});console.log(`${width}: static classroom passed`);
 }catch(e){await page.screenshot({path:`D:/knowledge-map/output/static-pages/${width}-failure.png`});throw e;}finally{await context.close();}
}}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
await writeFile(new URL('../output/static-pages/results.json',import.meta.url),JSON.stringify(results,null,2));
