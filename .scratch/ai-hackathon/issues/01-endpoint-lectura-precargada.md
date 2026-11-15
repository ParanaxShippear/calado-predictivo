# 01: Endpoint de lectura con respuestas precargadas

**What to build:** the two endpoints of the lector, answering with the deterministic fallback only. `GET /api/cotizaciones-ejemplo` serves the three sample documents; `POST /api/leer-cotizacion` validates the text, returns the stored reading for a sample (`origen: "precargado"`) or five null values for any other text (`origen: "sin_ia"`), always with `motivo: "sin_sdk"` for now, and runs the deterministic checks on every reading. No Claude call and no new dependency in this ticket. `AGENTS.md` is updated first, so the rest of the work is IN scope.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

Spec: `.scratch/ai-hackathon/spec.md` (S1, S2, S3, S5, S6, S8, S18; D4, D6, D7, D8, D9)

**Files:** `AGENTS.md`, `api/main.py`, `README.md`

- [ ] `AGENTS.md` carries the edits listed under "AGENTS.md edits" below, and nothing else changes in it.
- [ ] The three sample documents are `DEMO` constants in `api/main.py` with the exact `id`, `titulo` and `texto` of spec D8, each with its stored reading of spec D9.
- [ ] `GET /api/cotizaciones-ejemplo` returns `[{id, titulo, texto}]` for the three samples.
- [ ] `POST /api/leer-cotizacion` returns the contract of spec D7. A sample text returns its stored reading with `origen: "precargado"`; any other text returns five null values with `origen: "sin_ia"`. Matching a sample ignores differences in whitespace and case.
- [ ] Empty text returns 422 `El documento está vacío.`; text over 8,000 characters returns 422 `El documento supera los 8.000 caracteres.`
- [ ] Every reading goes through one function that applies the ranges and the cita verification of spec D6. For the stored readings every non-null value comes back with `cita_verificada: true`.
- [ ] The existing endpoints answer exactly as before.
- [ ] `README.md`: the API table lists the two new endpoints, each in one line.

## AGENTS.md edits

Replace the intro paragraph's last sentence `Hackathon MVP (4 h build): the pitch is the product.` with:

```text
A Claude-powered lector de cotizaciones reads a pasted quote and proposes the top-off costs; the user confirms them. Hackathon MVP: the pitch is the product.
```

In "Layout", replace the `api/main.py` line with:

```text
- `api/main.py`: single-file FastAPI app (scraping, vessel DB, draft model, lector de cotizaciones, endpoints).
```

In "Commands", replace the line that starts with `` `API_BASE` in `App.jsx` is hardcoded `` with:

```text
- `API_BASE` in `App.jsx` comes from `VITE_API_BASE`; without it, `http://localhost:8000/api` in dev and `/api` in production (Vercel).
- Verify the lector: with the API running, `python .scratch/ai-hackathon/probar_lector.py`.
```

In "Real vs demo data", extend the "Demo values today" bullet by adding `, the sample cotizaciones and their stored readings` before the final period, and add this section right after "Real vs demo data":

```text
## AI (lector de cotizaciones)
- Claude reads the document and proposes five values; the user confirms them; cost and ahorro neto stay the fixed formula. Describe it that way in the UI and in the pitch.
- Every reading shows its origin: `ia` (with the model that answered), `precargado` or `sin_ia`. A fallback keeps its own label.
- The sample documents are fictional and the UI says so.
- The request shape, the model and the limits are pinned in `.scratch/ai-hackathon/spec.md`; the values are named constants in `api/main.py`.
- The key comes only from the `ANTHROPIC_API_KEY` environment variable. Without it the lector answers with its fallback.
```

In "Hackathon constraints", replace the three bullets that start with `Scope is closed`, `Top-off implementation` and `Never claim INA/BCR data` with:

```text
- Scope is closed. IN: the existing dashboard, a "datos simulados" badge, an AIS indicator that never shows green, a top-off port comparison (Bahía Blanca, Quequén) with demo costs, a "no desviar" row, a "escenario crítico" label, rehearsal. UI improvements approved by the owner on 2026-10-24 (accessibility, es-AR number formats, decision hierarchy, an on-screen order document addressed to the agencia marítima; see `.scratch/ui-improvements/spec.md`). Added by the owner on 2026-11-13 for the Aleph Hackathon Rosario: ML/LLM, starting with the lector de cotizaciones (`.scratch/ai-hackathon/spec.md`), and the `anthropic` Python SDK. OUT: real scraping, live AIS, agencia view, tests, README roadmap, any other new dependency. If a request is not IN, say no.
- Top-off implementation: the port costs are frontend constants marked `DEMO` (2 ports, 2 cost components). A cotización confirmed by the user overrides them on screen. No API table, no extra cost components.
- The UI and the pitch say what is AI-driven, what is a deterministic model and what is simulated data. Present INA/BCR data or a forecast model as live or real only when it is.
```

## Verification

```bash
cd api && uvicorn main:app --port 8000
```

In a second terminal, from the repo root:

```bash
python .scratch/ai-hackathon/probar_lector.py
```

Expected: three `OK` lines with `origen=precargado`, `motivo=sin_sdk`, `citas_sin_verificar=0`, and `fallas=0`.

```bash
curl localhost:8000/api/pronostico-calado
```

Expected: the same top-level keys as before (`altura_actual_m, buque, carga_base_tn, es_hoy, es_pasado, fecha_analisis, fuentes, precio_soja_usd_tn, resumen, serie, ubicacion`).

```bash
curl -s -X POST localhost:8000/api/leer-cotizacion -H "Content-Type: application/json" -d "{\"texto\": \"hola\"}"
```

Expected: `origen` is `sin_ia` and the five values are null.

```bash
curl -s -X POST localhost:8000/api/leer-cotizacion -H "Content-Type: application/json" -d "{\"texto\": \"  \"}"
```

Expected: 422 with `El documento está vacío.`

Golden path: `cd client && npm run lint && npm run build`, then the UI with IMO `9436000` through the CSV download. No UI change is expected in this ticket.
