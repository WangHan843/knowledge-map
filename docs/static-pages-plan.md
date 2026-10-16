# GitHub Pages静态版实施计划（2026-10-16）

本轮用户明确授权迁移到纯前端。沿用现有视觉、教材和业务阈值，当前用户要求覆盖AGENTS/SPEC的服务端判分与SQLite部署限制；原后端与数据库保留，静态版使用独立存储空间，不自动迁移旧服务器历史。

## 设计与目录

- frontend/src/lib/runtime.ts：选择static/server，默认static；存储键按Vite base隔离同域不同仓库。
- lib/local-learning.ts + data/questions.json：本地题库、抽题、判分、原始题目快照、练习/正式历史、幂等提交、累计等级和错题查询；单个版本化localStorage文档保存，写入成功后才返回成功。支持Web Locks的浏览器串行化跨标签页写入，不支持时保持单标签页同步事务。
- lib/api.ts和server-api.ts：保留相同页面调用接口，静态默认不发起API请求；server模式保留FastAPI恢复路径。
- student-session/test-session：静态匿名ID与答题草稿独立于原后端记录，localStorage失败/损坏明确报错，不静默覆盖历史。
- pages/Mistakes.tsx：模块与练习/正式来源筛选、原选项/正确答案/解析、返回教材。
- main.tsx：静态HashRouter，链接为/repository/#/test，直接刷新不要求服务器路由重写；server保留BrowserRouter。
- vite.config.ts：base根据构建参数或GitHub仓库名生成，静态资源由Vite导入与base处理。
- .github/workflows/pages.yml：main推送或手动触发，安装锁定依赖→测试→构建→上传dist→Pages部署。

## 执行顺序与验证

1. 保存备份tmp/rollback-static；先写本地计分/存储失败/重复提交/累计边界等测试，观察缺少实现而失败，再实现适配器并验证。
2. 接通匿名存储、页面、错题导航；运行前端构建和单测。
3. 增加Hash路由、base及Actions；用模拟仓库子目录的严格静态服务器验证，而非依赖SPA fallback。
4. 375/390/430宽度验证图谱与教材、练习不计等级、随机六题、刷新续答、结果/错题重开恢复、没有/api请求；检查server模式仍可构建与原后端测试。
5. 更新README，提供创建空GitHub仓库、选择性上传、开启Actions Pages和更新说明。不登录、不推送、不改现有二维码。

## 已知边界

静态代码必然包含题库答案，页面答题期间仍不展示解析；不能提供防作弊或可信服务端成绩。localStorage是本浏览器数据，清理/换设备/换访问源不会同步；配额不足时不能声称保存成功。保留所有原始教材来源，不改题意或级别阈值。静态版不是离线缓存PWA，不增加无关功能。
