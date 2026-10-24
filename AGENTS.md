# Calado Predictivo

Agro-fintech command center. Projects the Paraná river height at Rosario, derives the safe draft of a Panamax vessel, and quantifies lost tonnage and lucro cesante in USD. Recommends date arbitrage and a top-off port (Bahía Blanca or Quequén). Hackathon MVP (4 h build): the pitch is the product.

## Layout
- `api/main.py`: single-file FastAPI app (scraping, vessel DB, draft model, endpoints).
- `client/src/App.jsx`: single-file React UI (Vite + Tailwind 4 + Recharts + Lucide).
- No test suite exists.

## Commands
- API: `cd api && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
- Client: `cd client && npm install && npm run dev`
- Verify client: `cd client && npm run lint && npm run build`
- Verify API: run it, then `curl localhost:8000/api/pronostico-calado`.
- `API_BASE` in `App.jsx` is hardcoded to `http://localhost:8000/api`. The demo runs locally unless that is changed.
- API contract and use cases: see README. Do not duplicate them here.

## Domain terms (use verbatim, never rename or translate)
calado, bajante, falso flete, lucro cesante, Panamax, top-off, IMO, INA, BCR, AIS.

## Real vs demo data
Demo data is allowed. Unlabeled demo data is not.
- While any source is simulated, the UI shows one visible "datos de demo" badge.
- AIS is always simulated (hardcoded `BUQUES`): never show it as live.
- Demo values today (inline, keep them as named constants marked `DEMO`): previous days and projection (`altura_para`, `DELTAS_PROYECCION_M`), `BUQUES`, top-off port costs (extra vessel days + grain premium at the completion port), the order number.
- Real sources attempted: river height (INA) and soy price (BCR) via scraping. Selectors are placeholders; on failure use the fallback and the `simulado` state (yellow indicator).
- Model assumptions: 2,200 tn per foot of draft, 45,000 tn base load. Changing one means updating it here (single source).

## Top-off mechanic
The vessel loads partially at Gran Rosario and sails south to complete its cargo at the port. Never state or imply that the cargo travels by train from Rosario: no source supports it.
- Ports, in priority order: 1) Bahía Blanca, 2) Quequén. Buenos Aires is not an option (34 ft draft, no grain operations).

## How to work
- Read-only until a change is requested. Explore the code before editing and report what you found.
- Quote the user's request verbatim in specs and tickets. Do not paraphrase when delegating.
- Ask only when blocked on a real decision. Otherwise pick the smaller option and say so.
- Smallest change that satisfies the request. No refactors or new dependencies unless asked.
- Never claim "works" without a command and its observed result (lint, build, curl, or the UI).
- Small commits, one concern each. Never push to `main`, open or merge PRs unless asked.
- Never read or write `.env`, keys or credentials. Every external call gets a timeout and a fallback.

## Hackathon constraints
- Scope is closed. IN: the existing dashboard, a "datos de demo" badge, an AIS indicator that never shows green, a top-off port comparison (Bahía Blanca, Quequén) with demo costs, a "no desviar" row, visible assumptions, a "escenario crítico" label, rehearsal. OUT: real scraping, ML/LLM, live AIS, agencia view, tests, README roadmap. If a request is not IN, say no.
- Top-off implementation: frontend constants only (2 ports, demo costs, 2 cost components). No new endpoint, no API table, no extra cost components.
- Primary persona: the agroexportadora. Golden path: today -> chart -> lucro cesante -> top-off port comparison -> export CSV. Must work on every commit.
- Default vessel is the Panamax. Nobody links an IMO in the demo.
- Never claim INA/BCR data or an AI model is live.
- If a task exceeds 30 min without closing, stop and report options.
- UI copy in Spanish.