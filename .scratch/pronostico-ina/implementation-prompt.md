# Implementation prompt (copy into Claude Code, Sonnet 5.5, medium effort)

Implement the real INA data and the statistical river forecast for Paranax, in this order.

1. Read `AGENTS.md`, then `.scratch/pronostico-ina/spec.md` and the tickets `01` to `05` in `.scratch/pronostico-ina/issues/`. The spec is the source of truth. Its "Further Notes" quote my decision of 2026-11-16: that is what puts this work IN scope until ticket 01 updates `AGENTS.md`. I confirmed decisions D1 to D7 on the condition that the MVP keeps working and shows its value: it is an MVP, so build no more than the tickets ask.
2. Pre-flight: run `git status --short` and `git branch --show-current`. The branch must be `feat/lector-cotizaciones` with a clean tree (the untracked folder `.scratch/pronostico-ina/` is expected). Anything else: stop and tell me.
3. Git: this prompt is my approval for creating the branch `feat/pronostico-ina` from the tip of `feat/lector-cotizaciones`, for a first commit of the plan folder as it is (`docs(pronostico): add the plan for INA data and the river forecast`), and for one commit per ticket, all staged by file name. Ask me before any other git write. Push and PRs stay with me.
4. Implement tickets 01 to 04 in that order. Then run the checks of ticket 05 that are not marked (human) and record their results in that file.
5. One ticket is one commit: its code and its docs together, Conventional Commits, no AI attribution. Subjects:
   - 01: `feat(pronostico): recalibrate the safe draft to the 2.47 m reference`
   - 02: `feat(pronostico): project the river from INA readings with a model`
   - 03: `feat(pronostico): chart the forecast range and add the 2021 bajante date`
   - 04: `docs(pronostico): describe the real river data and the statistical model`
   - 05: `docs(pronostico): record the rehearsal results`
6. The decisions are already made. Copy from the spec verbatim: the draft formula (D2), the model constants (D5), the algorithm (D6), the endpoint and stations (D7), the response fields (D8), the UI copy (D11), and the `AGENTS.md`, README and submission texts in the tickets. When something you need is in neither the spec nor the ticket, stop and ask me.
7. Smallest change that satisfies each ticket. The code stays in `api/main.py` and `client/src/App.jsx`; the one new file is the generated `api/_ina_historico.py`. No new dependency.
8. Network: this prompt approves HTTP GET requests to `alerta.ina.gob.ar` (the INA public API) from the tools in `.scratch/pronostico-ina/`. The API makes no remote call for river data. Nothing else remote.
9. After each ticket, run its "Verification" section and report each command with its observed output. A check you could not run is reported as not run, with the reason.
10. If a ticket takes more than 30 minutes without closing, stop and report options.

Points that are easy to get wrong:

- `.scratch/pronostico-ina/ina.py proyectar FECHA` is the reference implementation of the algorithm. When the API and the reference disagree, the API is wrong: compare point by point.
- The expected values in the spec and in `probar_pronostico.py` are fixed. A mismatch is a finding: report the expected and obtained values.
- The model constants are copied, never refitted: the API does no training.
- `api/_ina_historico.py` is written by the tool. Regenerate it; edit nothing in it by hand.
- The INA URL has `&` right after the path (`…/pub/datos/datos&timeStart=…`), with no `?`.
- The snapshot is the only source of readings: the API never calls the INA. Import it as spec D7 says, resolved from `Path(__file__)`'s directory and never from the working directory, or it will load locally and fail on Vercel.
- River heights go below zero (the lowest reading is -0,43 m). Real readings and projections are never clamped; only the simulated `altura_para` keeps its 0,5 m floor.
- With `origen: "modelo"`, a day after the anchor is `prediccion` even when the analysis date is in the past, and it carries `altura_observada_m`.
- A simulated scenario keeps its label everywhere: `proyeccion.origen`, `fuentes.ina`, the chip and the caption.
- The forecast is a "modelo estadístico" in every text. The word IA belongs to the lector.
- Time API calls from Python against `127.0.0.1`; on this machine `localhost` adds about 2 s per call.
- Existing response keys keep their names and formulas; the lector's code and `probar_lector.py` stay untouched.

At the end, report per ticket: what changed, the commands you ran with their observed results, and anything pending.
