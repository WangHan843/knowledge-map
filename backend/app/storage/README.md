# SQLite存储（阶段2已接入）

database.py默认使用backend/data/learning.sqlite3；KNOWLEDGE_MAP_DB可覆盖。schema版本2，启动支持0/1至2迁移，未知更高版本拒绝启动。SQLite不暴露为静态文件。

表：students（student_id、token_hash、创建时间）、questions（模块、版本、完整题库记录）、test_attempts（归属、状态、时间、提交结果JSON）、test_attempt_questions（题目顺序及冻结快照）、test_answers（原始选项及后端正确性）、practice_answers（练习快照、选项、请求ID、时间）。

每学生仅一份未提交测试，启动重试返回同一份。正式提交在BEGIN IMMEDIATE事务内检查归属、题集完整性、评分、保存答案、改状态、累计评价和冻结结果。重复提交返回原始result_json。已提交后即使后来测试改变累计等级，旧结果仍保持提交当时的等级；/api/levels返回当前累计等级。

WAL、foreign_keys、busy_timeout开启。每请求独立连接，check_same_thread=False仅适应FastAPI同步依赖在线程池中的切换；连接不跨请求复用。等级只统计submitted的正式答案，练习不进入查询。0/40/60/80边界采用整数比较，不四舍五入：未测评/不熟练/了解/熟悉/掌握。

匿名凭据在前端localStorage，服务器只存访问令牌摘要；不存姓名、学号、昵称。登录、教师、班级和复杂报告不在本阶段。

使用scripts/backup-db.ps1安全备份WAL数据库；不能仅复制在线主文件。测试使用临时数据库或output/phase2/qa.sqlite3，不向课堂数据库提交测试答案。

