# 《定位方法》知识图谱互动学习平台

当前默认是可部署到GitHub Pages的纯前端版本。React + TypeScript + Vite + SVG/d3-force；运行时不需要Python、FastAPI或SQLite。

手机端21节点图谱、探索模式、16篇教材讲解及原图保留。固定20题（每模块5题）、练习即时判分、随机6题正式测试、四模块累计等级、错题筛选和返回教材均在浏览器完成。

## 本地运行（只需要Node.js）

建议Node.js 24，使用PowerShell：

```powershell
Set-Location D:\knowledge-map\frontend
npm.cmd ci
npm.cmd run dev
```

打开 http://localhost:5173 。无需启动后端。手机与电脑同Wi-Fi时可运行 npm.cmd run dev -- --host 0.0.0.0，然后通过电脑局域网IP:5173访问。

构建根路径静态站点：

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

访问 http://localhost:4173 。不要直接双击dist/index.html使用file协议；应通过HTTP服务访问。

## GitHub Pages发布

完整操作、更新与回退说明见 [GitHub Pages部署指南](docs/github-pages.md)。

简要流程：创建空仓库 → 上传本项目源码（包括.github/workflows/pages.yml）→ Settings / Pages选择GitHub Actions → 推送main或手动运行工作流。工作流自动按仓库名计算base，上传的只有frontend/dist，不包含后端数据库或原始扫描件。

项目站点使用 /仓库名/；Hash路由为 /仓库名/#/test、/仓库名/#/mistakes。刷新和直接打开子页面不依赖服务器重写。教材图片、图谱懒加载包、CSS和favicon由Vite处理子路径。

## 本机记录与边界

- 首次自动生成匿名student_id，无登录、不采集姓名学号。
- localStorage保存匿名标识、练习历史、正式测试题目快照、原始作答、结果及答题草稿。
- 按部署base隔离同一个github.io域名下不同项目；静态记录与原服务端身份使用不同键，不会覆盖旧身份。旧SQLite记录不会自动迁移到浏览器。
- 四模块各自累计所有已提交正式答案：未作答为未测评；低于40%不熟练；40%至不足60%了解；60%至不足80%熟悉；80%及以上掌握。学生只看到等级。
- 练习永不计等级。每轮测试6题覆盖四模块、无重复，重复提交保留第一次的原答案，不重复累计。
- “我的错题”可筛选模块及正式/练习来源，重复错误按每次原始记录保留。
- 读取损坏或不兼容数据时保留原始内容并报错；存储空间不足时不会提示提交成功。
- 支持Web Locks的浏览器串行化多标签页写入；旧浏览器无此能力时请在单标签页完成作答。
- 同一访问源和浏览器刷新/重开可恢复；清除网站数据、隐私窗口关闭、换浏览器/设备/域名或仓库路径后不能自动恢复。没有云同步，也不是离线缓存PWA。
- 静态版的答案与判分代码必然可被查看或修改，因此用于课堂自主学习与自测，不提供服务端防作弊成绩。页面仍在统一提交前隐藏答案解析。

## 目录

```text
.github/workflows/pages.yml        自动测试、构建、部署
frontend/src/data/                 图谱、教材、比较说明、20题
frontend/src/lib/local-learning.ts 本地抽题、判分、累计、记录、错题
frontend/src/lib/static-api.ts     默认静态适配器
frontend/src/lib/server-api.ts     保留FastAPI适配器
frontend/src/lib/runtime.ts        模式与存储命名空间
frontend/src/pages/Mistakes.tsx    错题回顾
frontend/dist/                    静态构建产物（不提交Git）
frontend/dist-server/             服务端版构建产物（不提交Git）
backend/                         原FastAPI、SQLite逻辑与测试
scripts/                         Windows脚本、静态验收脚本
docs/                            部署、计划及验收记录
```

## 保留的服务端版本

后端及backend/data数据库保留，没有删除或迁移记录。切回服务器版本：

```powershell
Set-Location D:\knowledge-map\frontend
npm.cmd run build:server
Set-Location ..
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1 -SkipBuild
```

如尚未安装Python依赖，先运行scripts/setup.ps1。后端现在托管frontend/dist-server，静态产物dist不受影响。服务端前端使用BrowserRouter及/api，沿用原匿名身份和SQLite。开发模式使用npm.cmd run dev:server配合scripts/dev-backend.ps1。服务端错题页仍是原预留页，本轮新错题功能属于静态版。

frontend/src/data/questions.json是现有backend/app/questions.json的精确副本；测试验证两者一致。将来调整题库请同步两份；旧测试的题目快照不会变化。原SPEC中的服务端部署要求保留为历史基线，本轮静态版按2026-10-16用户要求实现。

## 验证与回退

```powershell
Set-Location D:\knowledge-map\frontend
npm.cmd test
npm.cmd run build
npm.cmd exec -- playwright install chromium
npm.cmd run test:static
```

test:static自动启动严格静态服务器，检查375/390/430宽度流程、Hash刷新、持久化、错题和零API请求。仓库子目录验收可先设置 $env:PAGES_BASE_PATH='/knowledge-map/' 再构建，完成后Remove-Item Env:PAGES_BASE_PATH。完整触控验收用scripts/mobile-2d-qa.mjs，QA_URL环境变量设置为正在运行的静态首页。

静态版验收记录见docs/static-pages-acceptance.md。迁移前备份在tmp/rollback-static；保留所有原始PDF/参考图于本地，未重写教材。原资料、数据库、依赖目录、备份和截图已加入.gitignore，避免误上传。线上回退应恢复上个可用Git提交后重新运行Pages工作流；不要删除学生浏览器数据。

