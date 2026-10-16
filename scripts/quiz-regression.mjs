export async function runQuizRegression(page) {
  const checks = [];
  await page.getByRole('button', { name: '第 4 题 AOA 未作答' }).click();
  if (!(await page.getByRole('button', { name: '提交演示答卷' }).isDisabled())) throw new Error('Incomplete test can submit');
  checks.push('Incomplete submission blocked');
  await page.getByRole('button', { name: '第 1 题 TOA 未作答' }).click();
  await page.getByRole('radio', { name: 'B 信号的传播时间' }).check();
  await page.reload();
  await page.getByRole('radio', { name: 'B 信号的传播时间' }).waitFor();
  if (!(await page.getByRole('radio', { name: 'B 信号的传播时间' }).isChecked())) throw new Error('Answer lost after reload');
  checks.push('Frozen attempt and answer restored after refresh');
  await page.getByRole('radio', { name: 'A 接收设备的屏幕尺寸' }).check();
  if (await page.getByText('正确答案', { exact: true }).count()) throw new Error('Answer key leaked in test UI');
  checks.push('Answer can be changed; no answer feedback during test');
  await page.screenshot({ path: 'D:/knowledge-map/output/mobile-2d/test-mobile.png', fullPage: true, timeout: 20000 });
  for (const [i, option] of [[1, 0], [2, 2], [3, 3]]) {
    await page.getByRole('navigation', { name: '题目导航' }).getByRole('button').nth(i).click();
    await page.getByRole('radio').nth(option).check();
  }
  await page.getByRole('button', { name: '提交演示答卷' }).click();
  await page.getByRole('heading', { name: '已完成本轮模拟测试' }).waitFor();
  if (!(await page.locator('main').innerText()).includes('本次答对 3 / 4 题')) throw new Error('Unexpected scoring result');
  if (await page.getByRole('status').count() !== 4) throw new Error('Missing answer explanations');
  await page.reload();
  await page.getByRole('heading', { name: '已完成本轮模拟测试' }).waitFor();
  if (!(await page.getByRole('radio', { name: 'A 接收设备的屏幕尺寸 你的选择' }).isChecked())) throw new Error('Original answer not retained');
  checks.push('Backend scores 3/4; review preserves original answer after refresh');
  await page.screenshot({ path: 'D:/knowledge-map/output/mobile-2d/result-mobile.png', fullPage: true, timeout: 20000 });
  await page.getByRole('link', { name: '定位方法知识图谱首页' }).click();
  await page.locator('.force-stage[data-render-state="idle"]').waitFor(); if (await page.locator('.force-level[data-level="unassessed"]').count() !== 4) throw new Error('Demo changed node levels');
  checks.push('Four graph levels remain unassessed');
  return checks;
}

import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
if(typeof process!=='undefined'&&process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const require=createRequire(new URL('../frontend/package.json',import.meta.url));
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await page.goto('http://localhost:8000/test');
    await page.getByRole('button',{name:'开始 4 题演示'}).click();
    console.log(await runQuizRegression(page));
    await page.goto('http://localhost:8000/learn/toa');
    await page.getByRole('button',{name:'双信号与往返测距'}).tap();
    await page.getByRole('dialog').waitFor();
    await page.waitForTimeout(250);
    await page.getByRole('button',{name:'关闭知识内容'}).tap();
    await page.waitForTimeout(200);
    if(!page.url().endsWith('/learn/toa')) throw Error('Sheet close touch leaked to another module');
    await page.getByRole('link',{name:'练习这个模块'}).tap();
    if(!page.url().endsWith('/practice/toa')) throw Error('Practice return used the wrong module');
    await page.getByRole('radio').first().check();
    await page.getByRole('button',{name:'确认答案'}).click();
    await page.getByRole('status').waitFor();
    console.log('Shared textbook lesson closes without click-through; correct module practice still works');
  }finally{await browser.close();}
}
