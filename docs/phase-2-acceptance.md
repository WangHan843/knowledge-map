# 阶段2交付与验收（2026-10-12）

## 当前范围

五步按顺序实施并分别验证：图谱首页视觉→教材内容→固定20题→匿名SQLite→正式测试累计评价。仍采用React/TypeScript/Vite + SVG/d3-force + FastAPI + SQLite。没有教师端、班级、登录、AI、RAG、复杂报告或公网部署。

## 分步验证

1. 视觉：中心/模块/知识点统一圆形且依次变小，21节点/22条教学关系保留；探索模式扩大图谱、隐藏底部导航。375/390/430宽度检查通过，构建及当时9项前端单元测试通过。
2. 内容：16篇讲解逐节点核对PDF8—11页，沿用已验证原图裁切，增加内容页到练习/测试入口；先完成390触控阅读回归再继续。正文、公式、来源、原图都由独立知识数据提供，没有为凑数生成内容。
3. 题库：5项题库测试通过。20题每模块5题，独立教材审阅完成；公开DTO不含答案/解析，问题及解析都有source。
4. 匿名：身份/归属/重启后读取测试通过，浏览器localStorage刷新保留。数据库启用WAL和外键，保存匿名身份及独立凭据摘要，不采集姓名学号。
5. 闭环：后端总计24项测试、前端总计11项测试通过，生产构建通过。正式题目快照、6题覆盖、非本轮答案拒绝、跨学生隔离、累计评价边界、练习隔离、并发重复提交、重建应用生命周期后恢复均验证。

## 手机浏览器触控仿真

Chromium + 真实触控输入事件，375×812、390×844、430×932竖屏：

- scripts/mobile-2d-qa.mjs：每个尺寸7组检查，拖拽/力平衡、单指平移、双指缩放和同向平移、全16个知识点阅读/滚动/原图加载、比较关系点击、视图保持、放大后的屏外节点可达。三个尺寸均通过，无脚本或HTTP错误。
- scripts/phase2-visual-qa.mjs：三尺寸探索模式、导航隐藏/恢复、统一圆形大小层级、无横向溢出通过。
- scripts/phase2-classroom-qa.mjs：三尺寸分别执行两轮正式测试，验证练习不计等级、随机6题覆盖、启动不泄题、草稿刷新恢复、结果刷新恢复、累计等级、图谱状态与颜色、薄弱模块返回教材再测试。通过。
- 多标签页草稿回归：每轮独立存储、增量保存、切题不覆盖其他标签页答案；两个单元回归通过。390宽度另验证同一浏览器双标签页切题与刷新保留答案。
- 已目视检查首页、等级反馈、手机底部阅读面板及结果页截图。正式测试的QA记录写入output/phase2/qa.sqlite3，未向课堂数据库提交答案。

产物：output/phase2/*-home.png、*-explore.png、*-graded-graph.png、*-formal-result.png、classroom-results.json；深度触控记录在output/mobile-2d/*-results.json。

这些是浏览器仿真结果，不等同于iOS/Android微信真机结论；下一步应以真实手机验收手势、软键盘/浏览器栏、安全区及网络访问。

## 核心行为

- 四个一级节点独立累计所有已提交正式答案；<40%不熟练、40%至不足60%了解、60%至不足80%熟悉、≥80%掌握；无答案未测评。当前规则覆盖原SPEC中40/60区间旧标签。
- 结果页显示本轮提交时累计等级及原始作答；首页读取实时累计等级。学生不看到模块正确率数值。
- 提交后修改答案重试也返回原始答卷，数据库不会重复累加。题库后续修改不影响已发测试的判分快照。
- 页面刷新恢复未提交草稿；已提交记录在SQLite。清理本站localStorage、更换浏览器/访问源后无法访问旧匿名身份，界面已说明。
- SQLite一致性备份脚本已执行并通过integrity_check。升级支持schema0/1→2，未知更高版本拒绝覆盖。

## 本轮文件清单

新增：
- backend/app/{assessment.py,learning.py,identity.py,question_bank.py,questions.json,storage/database.py}
- backend/tests/{test_learning.py,test_identity.py,test_question_bank.py}
- frontend/src/lib/{student-session.ts,test-session.ts,test-session.test.ts}
- scripts/{phase2-visual-qa.mjs,phase2-classroom-qa.mjs,backup-db.ps1}
- docs/{phase-2-plan.md,phase-2-acceptance.md}、.gitignore

修改：
- frontend/src/graph/{model.ts,scene.ts,mobile.css}
- frontend/src/components/{KnowledgeGraph.tsx,Layout.tsx,LearningSheet.tsx,QuestionCard.tsx}
- frontend/src/pages/{Practice.tsx,Test.tsx,Learn.tsx,Reserved.tsx}
- frontend/src/lib/{api.ts,use-module-levels.ts}、frontend/src/{types.ts,styles.css}
- backend/app/main.py、backend/app/storage/README.md
- scripts/{start.ps1,mobile-2d-qa.mjs}
- README.md、docs/{source-review.md,extension-contracts.md}

16篇knowledge-details.ts正文及既有图谱结构经复核后沿用，没有无必要重写。原教材、参考图、AGENTS.md和SPEC.md保持原样。旧demo接口隔离保留作阶段1回归，正式页面不再使用。

## 运行与回退

当前本机预览：http://localhost:8000 。手机同Wi-Fi访问方法、环境安装、备份与回退详见README。局域网启动参数为scripts/start.ps1 -ListenAddress 0.0.0.0 -SkipBuild；未建立cpolar隧道或更改二维码。

回退前备份数据库，停止服务并保存整个项目。阶段2前源码/依赖备份在tmp/rollback-phase2；阶段1不会读取正式数据库，但不要删除正式记录。当前阶段验收后再决定下一步，不自动进入教师端或其他扩展开发。
