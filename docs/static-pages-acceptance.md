# 静态GitHub Pages版本验收（2026-10-16）

## 实现结果

默认构建为独立静态应用。知识图谱21节点、22条教学关系、16篇教材、原图与原视觉交互保留。20题移至前端；练习、六题抽取、正式判分、原始作答、累计等级和错题查询在本浏览器运行。localStorage按base和匿名编号隔离记录，HashRouter兼容Pages子路径。

API公开形状仍不含答案，但静态JS必然带完整题库，不能宣称服务端防作弊。此取舍按本轮用户要求作出。旧后端与SQLite原数据保留，服务端构建通过独立适配器和dist-server继续运行，不将静态题库打包进服务端版页面。

## 验证证据

- npm.cmd test：5个测试文件、27项通过。含原图谱/教材/草稿测试，新增题库一致性、本地记录、六题覆盖、幂等提交、模块累计、精确阈值、错题保留、配额错误与损坏数据保护。
- npm.cmd run build与build:server均通过；服务端产物检查无local-learning或toa-01题库内容。
- backend下python -m pytest：24项通过，原后端计分和数据库测试保留。
- 仓库子目录/knowledge-map/构建，通过严格HTTP静态服务器测试，无API、无SPA路由回退。
- scripts/static-pages-qa.mjs：375×812、390×844、430×932通过；每尺寸执行练习与两轮正式测试，验证原始记录、累计图谱反馈、正式/练习错题及模块筛选、返回教材、刷新与重新打开浏览器配置后恢复。每尺寸API请求0，无资源错误。
- scripts/mobile-2d-qa.mjs指定QA_URL到静态预览：三个尺寸各7组深度触控检查通过，包括单指平移、拖拽力平衡、双指缩放/平移、全16篇教材滚动与原图、比较关系、关闭面板视角保持和屏外节点可达。
- 修复原全部20题练习题号栏不换行导致的手机横向溢出，增加相应浏览器断言。
- 独立只读代码审查未发现重要问题；另修复历史错题重复题目共享radio组名称的问题，保证每张回顾卡独立。
- 结果JSON与截图在output/static-pages；深度图谱结果在output/mobile-2d。正式课堂SQLite没有写入静态验收记录。

## 配置与文件

新增：.github/workflows/pages.yml；frontend/src/data/questions.json；lib/{runtime,local-learning,local-learning.test,static-api,server-api}.ts；pages/Mistakes.tsx；scripts/{serve-static,static-pages-qa}.mjs；docs/{static-pages-plan,static-pages-acceptance,github-pages}.md。

修改：前端main.tsx、vite.config.ts、tsconfig.json、package.json、index.html、styles.css；lib/{api,student-session,test-session,test-session.test}.ts；pages/Test.tsx；components/{Layout,QuestionCard}.tsx；scripts/{start.ps1,mobile-2d-qa.mjs}；backend/app/main.py静态托管目录；README与.gitignore。

图谱正文、教材裁图、原教材PDF、参考图、backend题库与评分规则未修改。迁移前备份在tmp/rollback-static。

## 尚未执行的外部步骤

没有创建GitHub仓库、登录、推送、远程运行Actions、启用线上Pages或更改二维码。工作流配置已按Vite/GitHub官方文档准备，远程能否成功仍须在用户账号实际运行后确认。没有以浏览器仿真代替微信真机与真实网络验收。

GitHub发布操作见github-pages.md。本地静态预览为http://localhost:4173/knowledge-map/。本机记录无法与SQLite或其他设备自动同步；清除网站数据会丢失记录。支持Web Locks的现代浏览器提供跨标签页写锁，其他浏览器请单标签页作答。
