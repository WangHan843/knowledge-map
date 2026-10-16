import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(new URL('../frontend/package.json',import.meta.url));
const{chromium}=require('playwright');const browser=await chromium.launch({headless:true});
await mkdir(new URL('../output/phase2/',import.meta.url),{recursive:true});
try{for(const width of [375,390,430]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('http://localhost:8000');await page.locator('.force-stage[data-render-state="idle"]').waitFor();
 assert.equal(await page.getByRole('button',{name:'图谱探索模式',exact:true}).count(),1);
 assert.equal(await page.locator('.force-node > circle').count(),21);assert.equal(await page.locator('.force-node > rect').count(),0);
 const diam=async id=>(await page.locator(`[data-node="${id}"] > circle`).boundingBox()).width;
 assert(await diam('ROOT')>await diam('TOA'));assert(await diam('TOA')>await diam('TOA-1'));
 const before=await page.locator('.force-stage').boundingBox();
 await page.getByRole('button',{name:'图谱探索模式',exact:true}).tap();
 await page.waitForTimeout(150);const after=await page.locator('.force-stage').boundingBox();assert(after.height>before.height);
 assert.equal(await page.locator('.mobile-nav').isVisible(),false);
 await page.getByRole('button',{name:'放大图谱',exact:true}).tap();await page.getByRole('button',{name:'适应全部节点',exact:true}).tap();
 await page.screenshot({path:`D:/knowledge-map/output/phase2/${width}-explore.png`,animations:'disabled'});
 await page.getByRole('button',{name:'退出探索模式',exact:true}).tap();assert(await page.locator('.mobile-nav').isVisible());
 await page.screenshot({path:`D:/knowledge-map/output/phase2/${width}-home.png`,animations:'disabled'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log(`${width}: circular hierarchy and exploration passed`);await context.close();
}}finally{await browser.close();}
