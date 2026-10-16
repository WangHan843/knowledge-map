# Codex working rules — Knowledge Map V1

1. Read `SPEC.md` before coding. Treat its confirmed business rules as acceptance criteria.
2. Inspect `source-materials/` and `references/` before writing educational content or UI. The source PDF is scanned; do not hallucinate exact text or diagram interpretation.
3. Keep the application small and local-first: React/Vite + FastAPI + SQLite; adapt if justified and explain changes.
4. Work iteratively. Begin with an implementation outline, repository tree, then **Phase 1** only. Run the app locally and verify the result before expanding.
5. No unnecessary AI, RAG, auth service, cloud service, separate domain, server purchase, or full-site cloning.
6. Do not expose answer keys in test-start API. Score on backend. Preserve submitted answers, and keep tests idempotent.
7. Four independent per-node levels from all valid formal-test answers. Student sees level labels, never the numeric percentage.
8. Mobile-first; never implement a desktop-only page disguised by viewport scaling.
9. All development commands should work on Windows PowerShell. Document setup and rollback.
10. Do not perform internet deployment, login to a provider account, or change the existing QR redirect without explicit instruction.
