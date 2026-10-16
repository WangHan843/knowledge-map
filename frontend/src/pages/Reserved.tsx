import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function Reserved({ kind }: { kind: "mistakes" | "teacher" }) {
  return (
    <div className="page reading-page">
      <Link className="back-link" to="/">
        <Icon name="back" size={18} />
        返回知识图谱
      </Link>
      <section className="panel reserved-card">
        <span className="reserved-icon">
          <Icon name={kind === "mistakes" ? "layers" : "signal"} size={36} />
        </span>
        <span className="quiet-tag">后续阶段开放</span>
        <h1>
          {kind === "mistakes" ? "把错题变成下一次的进步" : "教师基本统计"}
        </h1>
        <p>
          {kind === "mistakes"
            ? "正式测试接入后，这里将按知识点保留错题、原始作答与解析，并提供返回学习的入口。"
            : "后续接入教师登录与基本统计，查看参与人数、测试提交次数和各节点等级分布。"}
        </p>
        <div className="content-notice">
          此模块尚未开放。当前支持匿名教材学习、练习和正式测试，作答反馈可在测试结果页查看。
        </div>
        <Link
          className="button primary"
          to={kind === "mistakes" ? "/test" : "/"}
        >
          {kind === "mistakes" ? "前往正式测试" : "返回知识图谱"}
          <Icon name="arrow" size={18} />
        </Link>
      </section>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="page">
      <section className="panel reserved-card">
        <h1>没有找到这个知识点</h1>
        <p>可以回到图谱，选择 TOA、TDOA、RSS 或 AOA 继续学习。</p>
        <Link className="button primary" to="/">
          返回知识图谱
        </Link>
      </section>
    </div>
  );
}
