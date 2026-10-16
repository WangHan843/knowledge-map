import type {
  AnswerFeedback,
  Attempt,
  NodeId,
  Question,
  TestResult,
  Level,
} from "../types";
import {ensureStudent} from './student-session';
import type {LocalMistake} from './local-learning';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const student=await ensureStudent();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization:`Bearer ${student.token}`, ...init?.headers },
    });
  } catch {
    throw new ApiError("无法连接本地服务，请检查服务是否启动后重试。", 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      typeof data.detail === "string"
        ? data.detail
        : "提交内容有误，请检查选项后重试。",
      response.status,
    );
  }
  return response.json();
}
export const learningApi = {
  async mistakes():Promise<LocalMistake[]>{throw new Error('服务端错题查询尚未开放。');},
  questions: (nodeId?: NodeId) =>
    request<Question[]>(`/questions${nodeId ? `?node_id=${nodeId}` : ""}`),
  check: (questionId: string, selected: string, requestId: string) =>
    request<AnswerFeedback>("/practice/check", {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        selected_option: selected,
        request_id: requestId,
      }),
    }),
  start: () => request<Attempt>("/attempts", { method: "POST" }),
  current: () => request<Attempt|null>('/attempts/current'),
  levels: () => request<{node_id:NodeId;level:Level}[]>('/levels'),
  resume: (id: string) => request<Attempt>(`/attempts/${id}`),
  submit: (id: string, answers: Record<string, string>) =>
    request<TestResult>(`/attempts/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};
