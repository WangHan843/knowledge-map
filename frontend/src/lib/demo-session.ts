const KEY = "positioning-phase1-attempt-v1";
export interface DemoSession {
  id: string;
  token: string;
  answers: Record<string, string>;
  index: number;
}
export function readSession(): DemoSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (
      !value ||
      typeof value.id !== "string" ||
      typeof value.token !== "string"
    )
      return null;
    const answers: Record<string, string> = {};
    if (value.answers && typeof value.answers === "object") {
      for (const [id, option] of Object.entries(value.answers)) {
        if (typeof option === "string" && /^[ABCD]$/.test(option))
          answers[id] = option;
      }
    }
    return {
      id: value.id,
      token: value.token,
      answers,
      index: Number.isInteger(value.index)
        ? Math.max(0, Math.min(value.index, 3))
        : 0,
    };
  } catch {
    return null;
  }
}
export function saveSession(value: DemoSession): boolean {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* tab-only fallback */
  }
}
