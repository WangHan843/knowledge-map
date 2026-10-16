# 扩展契约（阶段2更新）

当前实现以docs/phase-2-plan.md与README为准。原阶段1模拟会话保留在独立/api/demo，不参与正式学习评价。

## 已实现的边界

- 图谱结构graph-structure.ts不包含题目或等级；knowledge-details.ts单独存16篇有教材出处的正文、公式和原图；二级节点只导航内容。
- 题库questions.json包含id/module/question/options/answer/explanation/source。question_bank.py公开白名单只返回题干、选项、模块和来源；答案/解析只由判分反馈返回。
- 匿名student_id及独立访问凭据存localStorage，后端存令牌摘要；没有姓名、学号或登录页面。
- /api/attempts每轮6题、覆盖4模块、快照固定；重复启动恢复未完成轮次，提交原子且幂等。前端草稿按测试ID分开，导航不覆盖其他标签页答案。
- /api/levels提供4个模块的累计等级，无百分数。只统计已提交正式作答。最新阈值顺序是40%了解、60%熟悉、80%掌握。
- SQLite存储约束、快照和迁移详见backend/app/storage/README.md。

## 后续按需扩展，尚未开发

已有原始答案、题目快照、归属及时间，可用于错题历史或教师统计；目前仅结果页回顾本轮答卷。MistakeRecord和TeacherSummary类型/预留路由保留，但没有公开统计接口或伪造统计数据。

后续教师功能必须在明确需求后加入服务端权限验证。cpolar、公网二维码和部署需要单独授权；本阶段没有修改这些设置。身份找回、跨设备同步、班级与报告均不在当前范围。

