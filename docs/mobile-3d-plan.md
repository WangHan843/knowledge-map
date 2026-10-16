# 手机 3D 图谱重构计划

本轮按用户最新要求替换 SPEC 原先建议的 SVG 图谱，仍停留在第一阶段。保留 React/Vite + FastAPI 技术栈及未来 SQLite 结构；不改题库、评分、正式测试抽题、累计评价、错题或统计规则，不部署公网。

## 实现范围与目录

- `frontend/src/graph/model.ts`：真实 xyz 拓扑与三维力模拟。初始 5 节点；一次展开一个模块的 3 个教材子节点，最多 8 节点、7 连线。
- `frontend/src/graph/gestures.ts`：独立的单指旋转、双指平移/缩放、450ms 长按拖动状态机。
- `frontend/src/graph/scene.ts`：Three.js 透视相机、球体/连线、随三维位置投影的清晰 HTML 标签、按需渲染及资源释放。
- `frontend/src/data/knowledge-details.ts`：12 个子知识点，来源定位到扫描 PDF 第 8–11 页及教材章节；不绑定题目和等级。
- `frontend/src/components/LearningSheet.tsx`：移动端底部内容面板、焦点管理、独立滚动、教材整理文字/公式/概念示意图。
- `frontend/src/components/KnowledgeGraph.tsx`、`pages/Home.tsx`、`graph/mobile.css`：手机全屏图谱、复位与操作提示。

长按拖动采用经过节点的相机平行平面；改变视角后可以调整三个空间轴。释放后节点继续参与力布局。复位只调整相机，不折叠分支。打开学习面板暂停图谱，关闭恢复原视角。

## 核验清单

先对手势状态机、拓扑和三维力布局编写行为测试，再实现界面。375×812、390×844、430×932 三组触屏浏览器均检查：初始 5 节点，展开/收起，小节点打开/滚动/关闭，旋转/捏合/平移/长按拖动，视角复位，页面无横向和纵向溢出。检查多指打断长按、指针取消、WebGL 异常及路由切换释放资源。截图单独检查标签清晰度与按钮可触达。

构建及原有后端测试必须通过。保存后端和答题页面文件哈希以确认未修改。浏览器触屏仿真不等于微信真机测试，验收记录必须注明此限制。

## 本地运行与回退

继续使用 `scripts/start.ps1` 和 localhost:8000。源文件修改前备份在 `tmp/rollback-mobile3d/src`。回退时先停止预览、另存当前成果，再把备份中的文件复制覆盖到 `frontend/src`；移除本轮新增的 `frontend/src/graph`、`components/LearningSheet.tsx`、`components/LessonDiagram.tsx`、`components/TouchButton.tsx` 和 `data/knowledge-details.ts`，重新构建。仅操作这些明确的项目内路径，保留教材、参考图和后端。

新增依赖为 Three.js、d3-force-3d、类型声明、Vitest 和 Playwright。回退后保留这些未使用依赖不影响旧版；若需清理，用 npm uninstall 删除新增包并移除 test/test:mobile 脚本，保留原 React/Vite/TypeScript 依赖。不修改数据库。
