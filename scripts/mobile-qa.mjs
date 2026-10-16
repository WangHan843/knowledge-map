import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// UI actions use browser touch input. evaluate is limited to observations.
export async function runMobileQA(
  browser,
  width,
  height,
  output = new URL("../output/mobile-3d/", import.meta.url).pathname.replace(
    /^\/(\w:)/,
    "$1",
  ),
  progress = () => {},
) {
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const client = await context.newCDPSession(page);
  const touch = (type, points) =>
    client.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: points.map((p) => ({
        ...p,
        radiusX: 2,
        radiusY: 2,
        force: 1,
      })),
    });
  const frame = () => page.waitForTimeout(80); // Renderer is intentionally capped at 30fps.
  const idle = () =>
    page.locator('.space-stage[data-render-state="idle"]').waitFor();
  const camera = () => page.locator(".space-stage").getAttribute("data-camera");
  const screenshot = (name) =>
    page.screenshot({
      path: `${output}/${width}-${name}.png`,
      scale: "css",
      animations: "disabled",
    });
  const tap = async (locator) => {
    await locator.waitFor({ state: "visible" });
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const rect = await locator.boundingBox();
    await touch("touchStart", [
      { id: 0, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    ]);
    await page.waitForTimeout(65); // A physical tap; avoid zero-duration taps mixed across CDP sessions.
    await touch("touchEnd", []);
    await frame();
  };
  const checks = [];
  progress(`Starting ${width}px`);
  const swipe = async (from, to) => {
    await touch("touchStart", [{ id: 0, ...from }]);
    for (let i = 1; i <= 10; i++) {
      await touch("touchMove", [
        {
          id: 0,
          x: from.x + ((to.x - from.x) * i) / 10,
          y: from.y + ((to.y - from.y) * i) / 10,
        },
      ]);
      await page.waitForTimeout(20);
    }
    await touch("touchEnd", []);
    await frame();
  };
  await page.goto("http://127.0.0.1:8000/");
  await idle();
  assert.equal(await page.locator(".space-node").count(), 5);
  assert.equal(await page.locator('[data-level="unassessed"]').count(), 4);
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportHeight: innerHeight,
  }));
  assert.equal(overflow.width, width);
  assert.equal(overflow.height, height);
  checks.push("5 initial nodes; four levels; no page overflow");
  await screenshot("initial");

  for (const module of ["toa", "tdoa", "rss", "aoa"]) {
    progress(`Opening ${module}`);
    await tap(page.locator(`[data-node="${module}"]`));
    await idle();
    assert.equal(await page.locator(".space-node").count(), 8);
    assert.equal(
      await page.locator(".space-node-detail [data-level]").count(),
      0,
    );
    const visibility = await page.locator(".space-node").evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBoundingClientRect();
        return (
          b.x >= 0 &&
          b.right <= innerWidth &&
          b.y >= 0 &&
          b.bottom <= innerHeight
        );
      }),
    );
    assert(visibility.every(Boolean), `${module} nodes clipped at ${width}px`);
    await screenshot(`${module}-expanded`);
    for (const child of await page
      .locator(".space-node-detail")
      .evaluateAll((es) => es.map((e) => e.dataset.node))) {
      progress(`Reading ${child}`);
      const expectedTitle = await page
        .locator(`[data-node="${child}"] strong`)
        .innerText();
      await tap(page.locator(`[data-node="${child}"] strong`));
      await page.getByRole("dialog").waitFor();
      assert.equal(
        await page.locator("#sheet-title").innerText(),
        expectedTitle,
      );
      await tap(page.getByRole("button", { name: "关闭知识内容" }));
      await idle();
    }
  }
  await tap(page.locator('[data-node="aoa"]'));
  await idle();
  assert.equal(await page.locator(".space-node").count(), 5);
  checks.push(
    "all four modules expand to 8; switching and collapse; children have no levels",
  );
  progress("Testing camera gestures");

  const box = await page.locator(".space-stage").boundingBox();
  let before = await camera();
  await swipe(
    { x: width / 2, y: box.y + box.height - 45 },
    { x: width / 2 + 70, y: box.y + box.height - 75 },
  );
  assert.notEqual(await camera(), before);
  checks.push("single-finger orbit");

  let start = (await camera()).split(",").map(Number);
  const y = box.y + box.height * 0.48;
  await touch("touchStart", [
    { id: 0, x: 110, y },
    { id: 1, x: width - 110, y },
  ]);
  for (let i = 1; i <= 8; i++) {
    await touch("touchMove", [
      { id: 0, x: 110 - i * 3, y },
      { id: 1, x: width - 110 + i * 3, y },
    ]);
    await page.waitForTimeout(20);
  }
  await touch("touchEnd", []);
  await frame();
  let finish = (await camera()).split(",").map(Number);
  const distance = (v) => Math.hypot(v[0] - v[3], v[1] - v[4], v[2] - v[5]);
  assert(distance(finish) < distance(start) * 0.9);
  checks.push("two-finger pinch changes camera distance");

  start = finish;
  await touch("touchStart", [
    { id: 0, x: 110, y },
    { id: 1, x: width - 110, y },
  ]);
  for (let i = 1; i <= 8; i++) {
    await touch("touchMove", [
      { id: 0, x: 110 + i * 4, y: y + i * 2 },
      { id: 1, x: width - 110 + i * 4, y: y + i * 2 },
    ]);
    await page.waitForTimeout(20);
  }
  await touch("touchEnd", []);
  await frame();
  finish = (await camera()).split(",").map(Number);
  assert(
    Math.hypot(
      finish[3] - start[3],
      finish[4] - start[4],
      finish[5] - start[5],
    ) > 10,
  );
  assert(Math.abs(distance(finish) - distance(start)) < 1);
  checks.push("two-finger pan changes target, preserves zoom");
  await screenshot("orbit-pan");

  await tap(page.getByRole("button", { name: "复位图谱视角" }));
  await page.waitForFunction(() => {
    const c = document
      .querySelector(".space-stage")
      .dataset.camera.split(",")
      .map(Number);
    return Math.abs(c[0] - c[3]) < 0.01 && Math.abs(c[1] - c[4]) < 0.01;
  });
  const reset = (await camera()).split(",").map(Number);
  assert(
    Math.abs(reset[0] - reset[3]) < 0.01 &&
      Math.abs(reset[1] - reset[4]) < 0.01,
  );
  checks.push("camera reset");
  progress("Testing long-press drag");
  // Rotate before dragging: a screen-plane drag now changes the world z axis as well.
  await swipe(
    { x: width / 2, y: box.y + box.height - 40 },
    { x: width / 2 + 45, y: box.y + box.height - 50 },
  );
  const node = page.locator('[data-node="toa"]');
  const positionBefore = (await node.getAttribute("data-position"))
    .split(",")
    .map(Number);
  const rect = await node.boundingBox();
  const point = { id: 0, x: rect.x + rect.width / 2, y: rect.y + 15 };
  await touch("touchStart", [point]);
  await page.locator('.space-stage[data-dragging="toa"]').waitFor();
  for (let i = 1; i <= 8; i++)
    await touch("touchMove", [
      { ...point, x: point.x + i * 4, y: point.y - i * 2 },
    ]);
  await frame();
  const positionDuring = (await node.getAttribute("data-position"))
    .split(",")
    .map(Number);
  assert(Math.abs(positionBefore[2] - positionDuring[2]) > 1);
  assert.notDeepEqual(positionBefore, positionDuring);
  await touch("touchEnd", []);
  await idle();
  assert.equal(await page.locator(".space-node-detail").count(), 0);
  checks.push("long-press drag changes xyz without activating node");

  await tap(page.getByRole("button", { name: "复位图谱视角" }));
  await frame();
  const center = await page.locator('[data-node="center"]').boundingBox();
  await touch("touchStart", [
    { id: 0, x: center.x + center.width / 2, y: center.y + 16 },
  ]);
  await page.locator('.space-stage[data-dragging="center"]').waitFor();
  await touch("touchCancel", []);
  await idle();
  assert.equal(
    await page.locator(".space-stage").getAttribute("data-dragging"),
    null,
  );
  checks.push("center supports hold; touch cancellation exits drag");
  progress("Testing sheet scrolling");

  await tap(page.locator('[data-node="toa"]'));
  await idle();
  before = await camera();
  await tap(page.locator('[data-node="toa-time"]'));
  await page.getByRole("dialog").waitFor();
  assert.equal(
    await page.locator(".space-stage").getAttribute("data-render-state"),
    "paused",
  );
  await screenshot("sheet");
  const sheet = await page.locator(".sheet-content").boundingBox();
  await swipe(
    { x: width / 2, y: sheet.y + Math.min(sheet.height - 40, 380) },
    { x: width / 2, y: sheet.y + 60 },
  );
  assert(
    await page.locator(".sheet-content").evaluate((e) => e.scrollTop > 30),
  );
  assert.equal(await page.evaluate(() => scrollY), 0);
  await screenshot("sheet-scrolled");
  // Wait for native inertial scrolling to stop before starting the next touch sequence.
  await page.locator(".sheet-content").evaluate(
    (e) =>
      new Promise((resolve) => {
        let previous = e.scrollTop;
        const timer = setInterval(() => {
          const current = e.scrollTop;
          if (Math.abs(current - previous) < 1) {
            clearInterval(timer);
            resolve();
          }
          previous = current;
        }, 100);
      }),
  );
  await tap(page.getByRole("button", { name: "关闭知识内容" }));
  await idle();
  assert.equal(await camera(), before);
  assert.equal(await page.locator("#root").evaluate((e) => e.inert), false);
  checks.push(
    "sheet content scrolls independently; closes with exact camera preserved",
  );

  const holdNode = await page.locator('[data-node="toa"]').boundingBox();
  await touch("touchStart", [
    { id: 0, x: holdNode.x + 49, y: holdNode.y + 16 },
  ]);
  await touch("touchStart", [
    { id: 0, x: holdNode.x + 49, y: holdNode.y + 16 },
    { id: 1, x: width - 25, y: box.y + 40 },
  ]);
  await page.waitForTimeout(520); // Intentional timing test: exceed the long-press threshold.
  assert.equal(
    await page.locator(".space-stage").getAttribute("data-dragging"),
    null,
  );
  await touch("touchEnd", []);
  checks.push("second finger cancels pending long press");
  assert.deepEqual(errors, []);
  const result = { width, height, checks, errors };
  await writeFile(
    `${output}/${width}-results.json`,
    JSON.stringify(result, null, 2),
  );
  await context.close();
  return result;
}

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const require = createRequire(
    new URL("../frontend/package.json", import.meta.url),
  );
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [w, h] of [
      [375, 812],
      [390, 844],
      [430, 932],
    ])
      console.log(await runMobileQA(browser, w, h, undefined, console.log));
  } finally {
    await browser.close();
  }
}
