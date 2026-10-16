import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { getNode } from "../data/nodes";
import { learningApi } from "../lib/api";
import type { AnswerFeedback, Question } from "../types";
import { QuestionCard, QuestionNav } from "../components/QuestionCard";
import { Icon } from "../components/Icon";
import { NotFound } from "./Reserved";

export function Practice() {
  const { nodeId } = useParams();
  if (nodeId && !getNode(nodeId)) return <NotFound />;
  return <PracticeSession key={nodeId ?? "all"} nodeId={nodeId} />;
}
function PracticeSession({ nodeId }: { nodeId?: string }) {
  const node = getNode(nodeId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, AnswerFeedback>>(
    {},
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const [finished, setFinished] = useState(false);
  const requestIds=useRef<Record<string,string>>({});
  useEffect(() => {
    let active = true;
    learningApi
      .questions(node?.id)
      .then((value) => {
        if (active) {
          setQuestions(value);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [node?.id, retry]);
  const q = questions[index];
  const completed = Object.keys(feedbacks).length;
  async function check() {
    if (!q || !answers[q.id] || busy) return;
    setBusy(true);
    setError("");
    try {
      const key=`${q.id}:${answers[q.id]}`;
      requestIds.current[key]??=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
      const feedback = await learningApi.check(q.id, answers[q.id],requestIds.current[key]);
      setFeedbacks((previous) => ({ ...previous, [q.id]: feedback }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page quiz-page">
      <Link className="back-link" to={node ? `/learn/${node.id}` : "/"}>
        <Icon name="back" size={18} />
        {node ? `返回 ${node.id.toUpperCase()} 学习` : "返回知识图谱"}
      </Link>
      <div className="quiz-heading">
        <div>
          <div className="eyebrow">自主练习 / 即时反馈</div>
          <h1>
            {node ? `${node.id.toUpperCase()} 知识点练习` : "全部知识点练习"}
          </h1>
          <p>教材题库 · {node ? "5 道" : "20 道"}单选题 · 练习不影响节点等级</p>
        </div>
        <div className="progress-summary">
          <span>
            完成进度{" "}
            <strong>
              {completed} / {questions.length || (node ? 5 : 20)}
            </strong>
          </span>
          <progress
            aria-label="练习完成进度"
            value={completed}
            max={questions.length || 1}
          />
        </div>
      </div>
      <div className="inline-note">
        <Icon name="info" size={17} />
        可反复练习，确认答案后立即查看教材解析与出处。
      </div>
      {error && (
        <div className="error-box" role="alert">
          {error}
          {!questions.length && (
            <button
              onClick={() => {
                setLoaded(false);
                setRetry((v) => v + 1);
              }}
            >
              重新加载
            </button>
          )}
        </div>
      )}
      {!loaded && (
        <div className="panel loading-state" role="status">
          正在加载教材题目…
        </div>
      )}
      {finished ? (
        <section className="panel completion-card">
          <span className="completion-icon">
            <Icon name="check" size={32} />
          </span>
          <h2>这轮练习完成了</h2>
          <p>
            已练习 {completed} 道教材题目。
            <br />
            练习不会改变知识图谱等级。
          </p>
          <div className="completion-actions">
            <button
              className="button primary"
              onClick={() => {
                setFinished(false);
                setIndex(0);
                setAnswers({});
                setFeedbacks({});
                requestIds.current={};
              }}
            >
              再练一次
            </button>
            <Link className="button secondary" to="/">
              返回图谱
            </Link>
          </div>
          <Link className="text-link" to="/test">
            进入正式测试 →
          </Link>
        </section>
      ) : (
        q && (
          <>
            <section className="panel quiz-panel">
              <QuestionCard
                question={q}
                index={index}
                selected={answers[q.id]}
                feedback={feedbacks[q.id]}
                disabled={busy}
                onSelect={(option) => {
                  setAnswers((previous) => ({ ...previous, [q.id]: option }));
                  setError("");
                }}
              />
              <div className="quiz-actions">
                <button
                  className="button secondary"
                  disabled={index === 0 || busy}
                  onClick={() => setIndex(index - 1)}
                >
                  <Icon name="back" size={18} />
                  上一题
                </button>
                {!feedbacks[q.id] ? (
                  <button
                    className="button primary"
                    disabled={!answers[q.id] || busy}
                    onClick={check}
                  >
                    {busy ? "检查中…" : "确认答案"}
                    <Icon name="check" size={18} />
                  </button>
                ) : (
                  <button
                    className="button primary"
                    onClick={() =>
                      index < questions.length - 1
                        ? setIndex(index + 1)
                        : completed === questions.length
                          ? setFinished(true)
                          : setIndex(
                              questions.findIndex(
                                (item) => !feedbacks[item.id],
                              ),
                            )
                    }
                  >
                    {index < questions.length - 1
                      ? "下一题"
                      : completed === questions.length
                        ? "完成练习"
                        : "继续未完成题目"}
                    <Icon name="arrow" size={18} />
                  </button>
                )}
              </div>
            </section>
            <QuestionNav
              questions={questions}
              index={index}
              answers={feedbacks}
              onChange={(i) => {
                if (!busy) setIndex(i);
              }}
            />
            <div className="quiz-tip">
              <Icon name="book" size={16} />
              先选择答案，再点击“确认答案”查看解析。
            </div>
          </>
        )
      )}
    </div>
  );
}
