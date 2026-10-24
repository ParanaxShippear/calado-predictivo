# Calado Predictivo

Agro-fintech command center. Projects the Paraná river height at Rosario, derives the safe draft of a Panamax vessel, and quantifies lost tonnage and lucro cesante in USD. Recommends date arbitrage and top-off at Bahía Blanca. Hackathon MVP (5-6 h): the pitch is the product.

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
- Demo values today (inline, keep them as named constants marked `DEMO`): previous days and projection (`altura_para`, `DELTAS_PROYECCION_M`), `BUQUES`, `COSTO_DESVIO_USD`, the order number.
- Real sources attempted: river height (INA) and soy price (BCR) via scraping. Selectors are placeholders; on failure use the fallback and the `simulado` state (yellow indicator).
- Model assumptions: 2,200 tn per foot of draft, 45,000 tn base load. Changing one means updating it here (single source).

## How to work
- Read-only until a change is requested. Explore the code before editing and report what you found.
- Quote the user's request verbatim in specs and tickets. Do not paraphrase when delegating.
- Ask only when blocked on a real decision. Otherwise pick the smaller option and say so.
- Smallest change that satisfies the request. No refactors or new dependencies unless asked.
- Never claim "works" without a command and its observed result (lint, build, curl, or the UI).
- Small commits, one concern each. Never push to `main`, open or merge PRs unless asked.
- Never read or write `.env`, keys or credentials. Every external call gets a timeout and a fallback.

## Hackathon constraints
- Primary persona: the agroexportadora. Golden path: pick date -> see projection -> simulate Bahía Blanca top-off -> export CSV. Must work on every commit.
- Agencia marítima is stretch (does not exist yet): a read-only view that receives the diversion order, backed by an in-memory `POST/GET /api/ordenes`. Only after the golden path is polished.
- Cut scope before quality. Anything outside the golden path is badged as demo or cut.
- If a task exceeds 30 min without closing, stop and report options.
- UI copy in Spanish.