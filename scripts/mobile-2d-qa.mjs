import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

export async function runMobileQA(browser,width,height,output=fileURLToPath(new URL('../output/mobile-2d/',import.meta.url)),progress=()=>{}){
  await mkdir(output,{recursive:true});
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage(),client=await context.newCDPSession(page),errors=[],images=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(r.resourceType()==='image')images.push(r.url());});
  const checks=[],stage=page.locator('.force-stage');
  const touch=(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({...p,radiusX:2,radiusY:2,force:1}))});
  const frame=()=>page.waitForTimeout(85);
  const idle=()=>page.locator('.force-stage[data-render-state="idle"]').waitFor();
  const view=()=>stage.getAttribute('data-view');
  const screenshot=name=>page.screenshot({path:`${output}/${width}-${name}.png`,scale:'css',animations:'disabled'});
  const tapXY=async(x,y)=>{await touch('touchStart',[{id:0,x,y}]);await page.waitForTimeout(65);await touch('touchEnd',[]);await frame();};
  const tap=async locator=>{
    await locator.waitFor({state:'visible'});
    await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
    const r=await locator.boundingBox();await tapXY(r.x+r.width/2,r.y+r.height/2);
  };
  const swipe=async(from,to)=>{await touch('touchStart',[{id:0,...from}]);for(let i=1;i<=12;i++){await touch('touchMove',[{id:0,x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]);await page.waitForTimeout(20);}await touch('touchEnd',[]);await frame();};
  const fit=async()=>{await tap(page.getByRole('button',{name:'适应全部节点',exact:true}));await frame();};
  const close=async()=>{await tap(page.getByRole('button',{name:'关闭知识内容'}));await page.getByRole('dialog').waitFor({state:'hidden'});};
  const position=id=>page.locator(`[data-node="${id}"]`).getAttribute('data-position');
  const point=async id=>{const r=await page.locator(`[data-node="${id}"] > :first-child`).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};};
  try{
    progress(`${width}: initial graph`);await page.goto(process.env.QA_URL??'http://localhost:8000');await idle();
    assert.equal(await page.locator('[data-node]').count(),21);assert.equal(await page.locator('[data-edge]').count(),22);
    assert.equal(await page.locator('.force-level').count(),4);assert.equal(await page.locator('.force-node-detail .force-level').count(),0);
    assert.equal(await page.locator('canvas').count(),0);assert.equal(images.length,0,'Textbook images fetched before opening a lesson');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
    const initialRects=await page.locator('[data-node]').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
    assert(initialRects.every(r=>r.x>=0&&r.x+r.w<=width&&r.y>=0&&r.y+r.h<=height));
    assert(await page.locator('[data-node]').evaluateAll(els=>els.every(e=>{const r=e.firstElementChild.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-node]')===e;})),'A node is covered at its touch center');
    const labelSize=await page.locator('[data-node="TOA"] .force-label').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a);assert(labelSize>=11.9);
    await screenshot('initial');checks.push('21 nodes / 22 edges; all in initial viewport; 4 readable module states; no initial image requests');
    const old=await view(),box=await stage.boundingBox();
    await swipe({x:width/2,y:box.y+18},{x:width/2+40,y:box.y+60});assert.notEqual(await view(),old);assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.evaluate(()=>scrollY),0);await fit();checks.push('Single finger pans blank space; document does not scroll');
    const beforePinch=(await view()).split(',').map(Number),cy=box.y+box.height/2;
    await touch('touchStart',[{id:0,x:width/2-45,y:cy},{id:1,x:width/2+45,y:cy}]);
    for(let i=1;i<=10;i++){await touch('touchMove',[{id:0,x:width/2-45-i*5,y:cy+i},{id:1,x:width/2+45+i*5,y:cy+i}]);await page.waitForTimeout(20);}
    await touch('touchEnd',[]);await frame();assert((await view()).split(',').map(Number)[0]>beforePinch[0]*1.8);assert.equal(await page.getByRole('dialog').count(),0);await screenshot('zoom');await fit();
    checks.push('Two finger zoom and centroid translation; no accidental node click');
    progress(`${width}: physics and lessons`);
    const p=await point('TOA'),previous=await position('TOA'),neighbor=await position('TOA-1');
    await swipe(p,{x:p.x+32,y:p.y+22});assert.notEqual(await position('TOA'),previous);assert.equal(await page.getByRole('dialog').count(),0);await idle();assert.notEqual(await position('TOA-1'),neighbor);await fit();
    const root=await point('ROOT'),rootPosition=await position('ROOT');await swipe(root,{x:root.x+25,y:root.y-25});await idle();assert.notEqual(await position('ROOT'),rootPosition);await fit();
    const settled=await position('TOA');await page.waitForTimeout(180);assert.equal(await position('TOA'),settled);
    checks.push('Module and center drag freely; neighbors respond; simulation settles and stops');
    // Every concept is reached using actual graph touch input, including zoom+pan.
    for(const method of ['TOA','TDOA','RSS','AOA']){
      await fit();await tap(page.locator(`[data-node="${method}"] circle`));await page.getByRole('dialog').waitFor();assert.equal(await page.locator('.concept-jumps button').count(),4);assert.equal(await page.locator('[data-node]').count(),21);await close();
      for(let i=1;i<=4;i++){
        const id=`${method}-${i}`;progress(`${width}: ${id}`);await fit();const before=await view();const pt=await point(id);await tapXY(pt.x,pt.y);await page.getByRole('dialog').waitFor();
        assert(await page.locator('.sheet-content').innerText().then(s=>s.includes('教材整理')&&s.includes('PDF第')&&!s.includes('正在核对')));
        assert.equal(await stage.getAttribute('data-render-state'),'paused');
        const scroll=page.locator('.sheet-content'),r=await scroll.boundingBox();await swipe({x:width/2,y:r.y+r.height-50},{x:width/2,y:r.y+45});
        if(await scroll.evaluate(e=>e.scrollHeight>e.clientHeight+20))assert(await scroll.evaluate(e=>e.scrollTop>0));
        for(const img of await page.locator('.textbook-figure img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.evaluate(e=>e.naturalWidth>0));}
        if(id==='TOA-4'||id==='RSS-4'||id==='AOA-3')await screenshot(id);
        assert.equal(await view(),before);await close();assert.equal(await view(),before);
      }
    }
    checks.push('All 4 module overviews retain 21 nodes; all 16 sourced lessons open, scroll, load figures and preserve view');
    for(const label of ['同步要求','几何定位']){await tap(page.getByRole('button',{name:label,exact:true}));await page.getByRole('dialog').waitFor();assert.equal(await page.locator('.concept-jumps button').count(),2);await tap(page.locator('.concept-jumps button').first());assert(await page.locator('.sheet-content').innerText().then(s=>s.includes('教材整理')));await close();}
    // The comparison curves themselves are interactive, not only the chips.
    await fit();const edgePoint=await page.locator('[data-relation="sync"]').evaluate(e=>{const p=e.getPointAtLength(e.getTotalLength()*.5),m=e.getScreenCTM();return{x:p.x*m.a+p.y*m.c+m.e,y:p.x*m.b+p.y*m.d+m.f};});
    await tapXY(edgePoint.x,edgePoint.y);await page.getByRole('heading',{name:'同步要求的比较'}).waitFor();await close();
    checks.push('Both semantic comparisons and links to concepts; direct dashed-curve touch');
    // Zoom to readable concept labels, then reach an initially offscreen leaf by panning.
    await fit();for(let i=0;i<4;i++)await tap(page.getByRole('button',{name:'放大图谱',exact:true}));
    const target=await point('RSS-1'),center={x:width/2,y:box.y+box.height/2};
    // Use a blank point verified from the current DOM before the touch gesture.
    const dx=center.x-target.x,dy=center.y-target.y;
    // Pan in bounded segments because real fingers cannot start outside the viewport.
    const steps=Math.ceil(Math.max(Math.abs(dx)/(width-110),Math.abs(dy)/(box.height-60)));
    for(let i=0;i<steps;i++){
      const sx=dx>=0?55:width-55,sy=dy>=0?box.y+25:box.y+box.height-25,spacing=dx>=0?45:-45;
      // Two-finger same-direction pan avoids selecting a node at the segment start.
      await touch('touchStart',[{id:0,x:sx,y:sy},{id:1,x:sx+spacing,y:sy}]);
      for(let j=1;j<=16;j++){await touch('touchMove',[{id:0,x:sx+dx/steps*j/16,y:sy+dy/steps*j/16},{id:1,x:sx+spacing+dx/steps*j/16,y:sy+dy/steps*j/16}]);await page.waitForTimeout(20);}await touch('touchEnd',[]);await frame();
    }
    const reached=await point('RSS-1');assert(Math.abs(reached.x-center.x)<5&&Math.abs(reached.y-center.y)<5,JSON.stringify({target,center,reached,dx,dy,steps,view:await view()}));await screenshot('readable-zoom');await tapXY(reached.x,reached.y);await page.getByRole('heading',{name:'信号强度衰减',exact:true}).waitFor();await close();await fit();
    checks.push('Zoomed offscreen concepts remain reachable through touch pan; fit restores all nodes');
    assert.equal(await page.locator('[data-node]').count(),21);assert.equal(await page.locator('.force-level[data-level="unassessed"]').count(),4);assert.deepEqual(errors,[]);
    const result={width,height,checks,errors,imageRequests:images.length};await writeFile(`${output}/${width}-results.json`,JSON.stringify(result,null,2));progress(`${width}: passed ${checks.length} checks`);return result;
  }catch(e){await screenshot('failure');throw e;}finally{await context.close();}
}
if(typeof process!=='undefined'&&process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const require=createRequire(new URL('../frontend/package.json',import.meta.url));const{chromium}=require('playwright');const browser=await chromium.launch({headless:true});
  try{for(const [w,h]of [[375,812],[390,844],[430,932]])console.log(await runMobileQA(browser,w,h,undefined,console.log));}finally{await browser.close();}
}
