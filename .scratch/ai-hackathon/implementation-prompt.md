# Implementation prompt (copy into Claude Code, Sonnet 5.5, medium effort)

Implement the lector de cotizaciones for Paranax, in this order.

1. Read `AGENTS.md`, then `.scratch/ai-hackathon/spec.md` and the tickets `01` to `05` in `.scratch/ai-hackathon/issues/`. The spec is the source of truth. Its "Further Notes" quote my authorization of 2026-11-13: that is what puts this work IN scope until ticket 01 updates `AGENTS.md`.
2. Pre-flight: run `git status --short`. If a file that a ticket lists has uncommitted changes, stop and ask me to commit them first.
3. Git: this prompt is my approval for `git pull`, for creating the branch `feat/lector-cotizaciones` from `main`, and for one commit per ticket, staged by file name. Ask me before any other git write. Push and PRs stay with me.
4. Implement tickets 01, 02, 03 and 04 in that order. Then run the checks of ticket 05 that are not marked (human) and record their results in that file.
5. One ticket is one commit: its code and its docs together, Conventional Commits, no AI attribution. Subjects:
   - 01: `feat(cotizacion): add reading endpoint with stored sample readings`
   - 02: `feat(cotizacion): add quote reader panel to the top-off simulator`
   - 03: `feat(cotizacion): read quotes with Claude and fall back on failure`
   - 04: `feat(cotizacion): show the cost origin in the order and document the AI`
   - 05: `docs(cotizacion): record the rehearsal results`
6. The decisions are already made. Copy from the spec verbatim: the constants and the call (D2), the prompt and the schema (D5), the sample documents (D8), the UI copy (D11) and the `AGENTS.md`, README and submission texts in the tickets. When something you need is in neither the spec nor the ticket, stop and ask me.
7. Smallest change that satisfies each ticket. The code stays in `api/main.py` and `client/src/App.jsx`. The only new dependency is `anthropic`.
8. I set `ANTHROPIC_API_KEY` in the shell that runs uvicorn. Work with the variable by name only. The model of spec D1 is confirmed. Before ticket 03, ask me to set the key. If the key is not set, do the no-key checks, commit, and list the checks that stay pending.
9. After each ticket, run its "Verification" section and report each command with its observed output. A check you could not run is reported as not run, with the reason.
10. If a ticket takes more than 30 minutes without closing, stop and report options.

Points that are easy to get wrong:

- The call is `client.beta.messages.create`: `fallbacks` and `betas` exist only on the beta surface.
- Send exactly the parameters of spec D2. Shapes from older examples (`budget_tokens`, `thinking: {"type": "disabled"}`, a forced `tool_choice`, `temperature`, a top-level `output_format`) return a 400 on this model.
- Read `stop_reason` first, then take the first block whose type is `text`. The response can begin with `thinking` or `fallback` blocks.
- `anthropic.Anthropic()` builds without a key, so check the environment variable yourself before calling.
- Catch `APITimeoutError` before `APIConnectionError`; it is a subclass.
- A failed or skipped call answers HTTP 200 with the fallback. Only an empty or oversized document is a 422.
- A fallback keeps its own label on screen: "Leído por IA" appears only when `origen` is `ia`.
- The `DEMO` constants of `App.jsx` keep their values. A cotización overrides them on screen only.
- The vessel loads partially at Gran Rosario and sails south to complete its cargo. That is the only mechanic the UI and the sample documents describe.
- The expected values in the spec and in `probar_lector.py` are fixed. A mismatch is a finding: report the expected and obtained values.

At the end, report per ticket: what changed, the commands you ran with their observed results, and anything pending.
