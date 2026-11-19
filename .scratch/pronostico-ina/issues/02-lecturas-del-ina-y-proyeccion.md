# 02: Lecturas del INA y proyección en la API

**What to build:** `GET /api/pronostico-calado` answers with real INA readings and the model's projection for every date the snapshot covers, with no network call. The snapshot module is generated with the tool, the model constants are copied from the spec, and the series follows the algorithm of spec D6 with the new fields of D8. A date with no anchor, or an API without the snapshot module, answers with the simulated scenario and says so. The frontend is not touched: it keeps working because every existing key keeps its meaning.

**Blocked by:** 01: Alcance y modelo de calado.

**Status:** ready-for-agent

Spec: `.scratch/pronostico-ina/spec.md` (S4, S6, S7, S8, S9, S15, S17, S18; D5, D6, D7, D8, D9)

**Files:** `api/_ina_historico.py` (generated), `api/main.py`, `AGENTS.md`, `README.md`

- [ ] `api/_ina_historico.py` is generated with `python .scratch/pronostico-ina/ina.py historico` and committed as written. This is the only step of the ticket that needs the network.
- [ ] `api/main.py` imports the module exactly as spec D7 says (`sys.path.insert(0, str(Path(__file__).parent))`, then `import _ina_historico`, inside `try / except Exception`), and sets it to `None` on failure.
- [ ] `UMBRAL_AGUAS_BAJAS_M`, `COEF_PRONOSTICO` and `RANGO_PRONOSTICO` are copied from spec D5, verbatim, with a one-line comment pointing to `.scratch/pronostico-ina/ina.py ajustar`.
- [ ] The series follows spec D6 step by step: the anchor rule, `historico` and `prediccion` by anchor, the repeat of the latest earlier reading for a day with none, the rounding of `altura_rio_m`, `altura_min_m` and `altura_max_m`, and `altura_observada_m`.
- [ ] The response carries the additions of spec D8 on every point and at top level; every existing key keeps its name and formula.
- [ ] `fuentes.ina` is `archivo` when there is an anchor and `simulado` when there is none. The API makes no request to the INA.
- [ ] With no anchor, or with the snapshot module missing, the response is the simulated scenario: the existing `altura_para` logic from `ALTURA_FALLBACK_M`, the three new fields null, `proyeccion = {"origen": "simulada", "ancla": null}`.
- [ ] `fecha` after today returns 422 `La fecha no puede ser posterior a hoy.`; `fecha` before 2019-01-09 returns 422 `No hay lecturas del INA anteriores al 2019-01-09.` The 7-days-ahead rule is removed.
- [ ] `scrapear_altura_rio`, `INA_URL` and `INA_SELECTOR` are removed. The BCR scraper and its cache are untouched.
- [ ] `AGENTS.md` and `README.md` carry the edits listed below.

## AGENTS.md edits

In "Layout", replace the `api/main.py` line and add the next one:

```text
- `api/main.py`: single-file FastAPI app (INA readings and river forecast, BCR scraping, vessel DB, draft model, lector de cotizaciones, endpoints).
- `api/_ina_historico.py`: generated snapshot of INA daily heights since 2019. Regenerate it with the tool; edit nothing by hand.
```

In "Commands", add:

```text
- Verify the forecast: with the API running, `python .scratch/pronostico-ina/probar_pronostico.py`.
- Refresh the INA snapshot: `python .scratch/pronostico-ina/ina.py historico`, then commit `api/_ina_historico.py`.
```

In "Real vs demo data", in the bullet that starts with `Demo values today`, replace `previous days and projection (`altura_para`, `DELTAS_PROYECCION_M`)` with `the simulated river scenario shown only when no INA reading exists for the date (`ALTURA_FALLBACK_M`, `altura_para`, `DELTAS_PROYECCION_M`)`.

Replace the bullet that starts with `Real sources attempted:` with:

```text
- Real sources: daily river heights of Rosario, Diamante and La Paz from the INA public JSON API, served from the snapshot `api/_ina_historico.py`. The INA indicator shows `archivo` for real readings and `simulado` for the simulated scenario. The soy price (BCR) is still a placeholder scraper: on failure it uses the fallback and the `simulado` state.
```

Add this section right after "Real vs demo data":

```text
## River forecast
- It is a statistical model: a linear regression per horizon, fitted on INA readings of 1990-2018, with constants in `api/main.py`. Call it "modelo estadístico" in the UI and in the pitch; the AI of the product is the lector.
- Its measured error and its limits are in `.scratch/pronostico-ina/spec.md` D5. Quote those numbers; claim nothing beyond them.
- Every projection states its origin: `modelo` or `simulada`. A simulated scenario keeps its label.
- `.scratch/pronostico-ina/ina.py proyectar` is the reference implementation: the API returns the same numbers.
```

## README edits

In "Datos reales y datos simulados", replace the rows "Altura del río (INA)" and "Días previos y proyección" with:

```text
| Altura del río (INA) | Media diaria de Rosario, Diamante y La Paz, de la API pública del INA. Se sirve desde un archivo incluido en el repositorio (`api/_ina_historico.py`, desde 2019). | Real. El indicador dice "datos reales (archivo)". |
| Proyección del río | Modelo estadístico (regresión lineal) ajustado con lecturas del INA de 1990 a 2018. Proyecta hasta 5 días desde la última lectura. | Modelo determinístico, no IA. Error medio a 72 hs en 2019-2026: 9,1 cm, contra 13,7 cm de suponer que el río no cambia. |
| Escenario simulado del río | Constantes en `api/main.py` | Demo. Solo se muestra cuando no hay lecturas del INA para la fecha, y la interfaz lo indica. |
```

In "API", replace the row of `?fecha=YYYY-MM-DD` with:

```text
| `GET /api/pronostico-calado?fecha=YYYY-MM-DD` | Igual, para otra fecha de análisis, entre 2019-01-09 y hoy. Cada punto proyectado trae su rango y, en fechas pasadas, la lectura que ocurrió. |
```

In "Estructura", add the line `api/_ina_historico.py  lecturas del INA desde 2019 (generado; no editar a mano)`.

## Verification

```bash
python .scratch/pronostico-ina/ina.py historico
```

Expected: three lines with the readings per station and `escrito ...api/_ina_historico.py: 2019-01-01 a <yesterday or today>`.

```bash
python .scratch/pronostico-ina/ina.py proyectar 2021-07-21
```

Expected: the eight rows of spec D9, with `ancla 2021-07-21`.

```bash
cd api && uvicorn main:app --port 8000
```

```bash
python .scratch/pronostico-ina/probar_pronostico.py
```

Expected: every line `OK`, `fuentes.ina=archivo` for 2021-07-21, and `fallas=0`. The line for today reports `origen: modelo` while the snapshot is at most two days old.

Snapshot missing: rename `api/_ina_historico.py` temporarily, restart uvicorn and run:

```bash
python -c "import json,urllib.request as u; d=json.load(u.urlopen('http://127.0.0.1:8000/api/pronostico-calado?fecha=2021-07-21')); print(d['proyeccion'], d['fuentes']['ina'])"
```

Expected: `{'origen': 'simulada', 'ancla': None} simulado`. Restore the file before committing.

```bash
python .scratch/ai-hackathon/probar_lector.py http://127.0.0.1:8000/api
cd client && npm run lint && npm run build
```

UI, unchanged code: IMO `9436000`, pick 2021-07-21 in the calendar. The KPIs read -0,14 m, 9.800 tn and USD 3.920.000; the comparison matches the 2021-07-21 rows of spec D9; the golden path runs through the CSV download. On today's date the best option is "No desviar".
