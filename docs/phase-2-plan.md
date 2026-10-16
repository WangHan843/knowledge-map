# 阶段2实施计划

用户本轮已明确授权按五步实施，不需要重复确认设计。保持React/TypeScript/Vite + SVG/d3-force + FastAPI；引入Python标准库SQLite持久化。五步各自验证后再继续，不开发教师端、登录系统、AI、班级或复杂报告。

本轮新规则覆盖旧SPEC的等级顺序：无正式作答=未测评，低于40%=不熟练，40%至不足60%=了解，60%至不足80%=熟悉，80%及以上=掌握。保留六题覆盖四模块、无重复、提交幂等和服务端判分。

## 目录及顺序

1. frontend/src/graph/{scene,model,mobile.css}、components/{KnowledgeGraph,Layout}：统一圆形节点，中心最大、模块中等、知识点最小；探索模式最大化，保留真实力布局。构建、单元测试、手机三尺寸检查后进入下一步。
2. data/knowledge-details、LearningSheet：核对PDF8—11页，保持16篇正文/公式/原图/来源独立数据；提供模块练习入口。内容覆盖测试、构建、手机阅读验证。
3. backend/app/question_bank.py、questions.json：固定20道经教材核对的单选题，每模块5道，携带source；后端白名单公开DTO排除答案解析。题库数量、ID、选项、答案来源测试通过再继续。
4. backend/app/storage/database.py、identity.py、frontend/lib/student-session.ts：首次无感建立随机student_id及独立访问令牌，localStorage保存；SQLite学生/练习/测试记录，WAL、外键及事务。验证身份恢复、令牌隔离与重启持久化。
5. backend/app/learning.py、assessment.py、前端API/练习/测试/状态适配：20题练习不计等级；每轮6题覆盖四模块、冻结题目快照；原始答案与提交在单事务内保存，重复提交不重复累计；结果及图谱读取累计等级。测试边界、无重复、跨学生隔离、重启恢复、并发幂等、三尺寸闭环。

## 保留与回退

重构前源码在tmp/rollback-phase2，原教材与参考图不修改。正式数据库默认backend/data/learning.sqlite3，测试使用临时目录，允许KNOWLEDGE_MAP_DB设置备份/测试路径。回退前停服务并备份数据库，再恢复该备份中的frontend-src和backend-app到原目录，恢复package文件、npm.cmd ci并构建。不要删除数据库或将正式答题记录导入演示模式。

## 运行与范围

默认localhost:8000，同源API和静态文件。补充同一局域网手机访问的显式Host参数与说明，不开启cpolar或修改二维码。完成后提供文件清单、测试记录及手机验收方法。
