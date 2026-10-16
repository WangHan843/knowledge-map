import { Link } from "react-router-dom";
import {useId} from 'react';
import type { AnswerFeedback, Question } from "../types";
import { Icon } from "./Icon";
import { getNode } from "../data/nodes";

export function QuestionCard({
  question,
  index,
  selected,
  feedback,
  disabled,
  onSelect,
}: {
  question: Question;
  index: number;
  selected?: string;
  feedback?: AnswerFeedback;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  const reviewId=useId();
  return (
    <div className="question-content">
      <div className="question-meta">
        <span>
          第 {index + 1} 题 <span className="muted">/ 单选题</span>
        </span>
        <span className="topic-tag">
          {question.node_id.toUpperCase()} · {getNode(question.node_id)?.name}
        </span>
      </div>
      <fieldset className="question-fieldset" disabled={disabled || !!feedback}>
        <legend>{question.stem}</legend>
        <div className="answer-options">
          {question.options.map((option) => {
            const chosen = selected === option.id;
            const correct = feedback?.correct_option === option.id;
            const wrong = !!feedback && chosen && !correct;
            return (
              <label
                key={option.id}
                className={`answer-option${chosen ? " selected" : ""}${correct ? " correct" : ""}${wrong ? " wrong" : ""}`}
              >
                <input
                  type="radio"
                  name={feedback?`${question.id}-${reviewId}`:question.id}
                  value={option.id}
                  checked={chosen}
                  onChange={() => onSelect(option.id)}
                />
                <span className="option-letter">{option.id}</span>
                <span className="option-text">{option.text}</span>
                {correct ? (
                  <span className="answer-marker">
                    <Icon name="check" size={17} />
                    正确答案
                  </span>
                ) : wrong ? (
                  <span className="answer-marker">
                    <Icon name="close" size={17} />
                    你的选择
                  </span>
                ) : chosen ? (
                  <Icon name="check" size={18} />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>
      {feedback && (
        <div
          className={`answer-feedback ${feedback.is_correct ? "feedback-correct" : "feedback-wrong"}`}
          role="status"
        >
          <strong>
            <Icon name={feedback.is_correct ? "check" : "info"} size={19} />
            {feedback.is_correct
              ? "回答正确，继续保持。"
              : "这道题还可以再想一想。"}
          </strong>
          <p>{feedback.explanation}</p>
          {feedback.source&&<p className="small-muted">教材来源：{feedback.source}</p>}
          <Link to={`/learn/${question.node_id}`}>
            返回 {question.node_id.toUpperCase()} 复习 →
          </Link>
        </div>
      )}
    </div>
  );
}

export function QuestionNav({
  questions,
  index,
  answers,
  onChange,
}: {
  questions: Question[];
  index: number;
  answers: Record<string, unknown>;
  onChange: (index: number) => void;
}) {
  return (
    <nav className="question-nav" aria-label="题目导航">
      {questions.map((question, i) => (
        <button
          type="button"
          key={question.id}
          className={`${index === i ? "current" : ""} ${answers[question.id] ? "answered" : ""}`}
          onClick={() => onChange(i)}
          aria-label={`第 ${i + 1} 题 ${question.node_id.toUpperCase()} ${answers[question.id] ? "已作答" : "未作答"}`}
          aria-current={index === i ? "step" : undefined}
        >
          <span>
            <i />
            {String(i + 1).padStart(2, "0")}
          </span>
          <strong>{question.node_id.toUpperCase()}</strong>
        </button>
      ))}
    </nav>
  );
}
