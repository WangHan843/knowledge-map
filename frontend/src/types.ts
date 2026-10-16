export type NodeId = "toa" | "tdoa" | "rss" | "aoa";
export type Level =
  "unassessed" | "unskilled" | "familiar" | "understood" | "mastered";
export const levelLabels: Record<Level, string> = {
  unassessed: "未测评",
  unskilled: "不熟练",
  familiar: "熟悉",
  understood: "了解",
  mastered: "掌握",
};
export interface KnowledgeNode {
  id: NodeId;
  name: string;
  english: string;
  measure: string;
  summary: string;
  concepts: { title: string; text: string }[];
  application: string;
  source: string;
  level: Level;
  review_status: "mock" | "pending" | "approved";
}
// Public question DTO never contains the answer key or explanation.
export interface Question {
  source?: string;
  id: string;
  node_id: NodeId;
  stem: string;
  options: { id: string; text: string }[];
  is_demo: boolean;
}
export interface AnswerFeedback {
  source?: string;
  question_id: string;
  node_id: NodeId;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string;
  is_demo: boolean;
}
export interface TestResult {
  attempt_id: string;
  is_demo: boolean;
  correct_count: number;
  total: number;
  answers: AnswerFeedback[];
  nodes: { node_id: NodeId; level: Level }[];
}
export interface Attempt {
  id: string;
  token?: string;
  questions: Question[];
  is_demo: boolean;
  result: TestResult | null;
}
// Future persisted records remain separate from temporary demo state.
export interface Participant {
  id: string;
  nickname: string;
}
export interface MistakeRecord {
  attempt_id: string;
  question: Question;
  answer: AnswerFeedback;
}
export interface TeacherSummary {
  participant_count: number;
  submitted_test_count: number;
  level_counts: Record<NodeId, Record<Level, number>>;
}
