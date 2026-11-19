Status: ready-for-agent (decisions D1 to D7 confirmed by the owner on 2026-11-16, on the condition that the MVP keeps working and shows its value)

# Spec: Real INA data and a statistical river forecast

Written 2026-11-16 for the Aleph Hackathon Rosario of 2026-11-28. It is "option 2" of the AI proposal; option 1 (the lector de cotizaciones, `.scratch/ai-hackathon/`) is implemented on `feat/lector-cotizaciones`.

## Problem Statement

The product says it projects the river, and today that projection is a `DEMO` curve around a fixed 3,49 m. The INA indicator has never left `simulado`: the scraper points at a placeholder page. The calendar's "escenario histórico" is simulated too, so no number on screen comes from the Paraná.

Real readings do not fit the current draft formula either. With the 0,78 m of 2020-04-13 it gives 20,3 ft, while the port operated at 31'06" that week. Plugging real data into that formula would show a Panamax losing two thirds of its cargo.

## Solution

River heights come from the INA public JSON API: the daily mean at Rosario, plus Diamante and La Paz upstream. A snapshot from 2019 to the latest published day, regenerated the evening before the pitch, ships with the API: the running app makes no call to the INA. A linear regression fitted on 1990-2018 projects Rosario up to five days from the last reading and reports the range its errors had. The safe draft is recalibrated to the reference level BCR cites.

The demo opens on today (the river is high in November 2026: no loss, "No desviar") and jumps with one button to 2021-07-21, the week of the lowest level in fifty years, where everything on the chart is a real reading or a projection made only with data up to that day, next to what the river then did.

The forecast is a statistical model and is labelled as one. The AI of the product is still the lector.

## Requirements

Scope and model

- **S1.** `AGENTS.md` and `README.md` put real INA data and the statistical forecast IN scope, with the owner's decision quoted in this spec.
- **S2.** The safe draft follows D2: 34 ft at or above 2,47 m at Rosario, minus 1,7 ft per metre below.
- **S3.** The `DEMO` values follow D3 and D4: Quequén's extra days are 5, and the simulated scenario starts at 1,00 m.

Data

- **S4.** `api/_ina_historico.py` is a generated module with the daily mean heights of Rosario, Diamante and La Paz from 2019-01-01. The API loads it from its own directory, guarded, and still works without it.
- **S5.** Removed by the owner on 2026-11-16 to keep the MVP small: the API reads no INA data while it runs (see Out of Scope).
- **S6.** `fuentes.ina` reports `archivo` when the snapshot gives an anchor and `simulado` when it does not. A simulated scenario is never reported as real.

Forecast

- **S7.** The projection follows D5 and D6: the constants pinned there, an anchor on the last day with complete readings, horizons of 1 to 5 days and the range by regime.
- **S8.** `GET /api/pronostico-calado` keeps every existing key and adds the fields of D8.
- **S9.** With no anchor within two days of the analysis date, the API answers with the existing simulated scenario and says so (`proyeccion.origen: "simulada"`). A date after today or before 2019-01-09 returns 422.

Frontend

- **S10.** The chart draws the range of the projection and, for past dates, what the river did afterwards.
- **S11.** The chart section states the origin of the data and the measured error of the model, with the copy of D11.
- **S12.** When today has no reading yet, the height KPI says it is an estimate and shows the last reading.
- **S13.** The INA indicator shows the `archivo` state.
- **S14.** The date field accepts 2019-01-09 to today, and two buttons jump to 2021-07-21 and to today.

Honesty and docs

- **S15.** `AGENTS.md`, `README.md`, `docs/hackathon-submission.md` and the lector's plan (`.scratch/ai-hackathon/`) describe the river data and the model as they now are, in the same tickets that change them.
- **S16.** The UI and the pitch call the forecast a statistical model, state its measured error, and keep "simulado" for the scenario that is simulated.

Demo

- **S17.** With IMO `9436000` on 2021-07-21 the API and the screen show the values of D9.
- **S18.** The golden path works on every commit, and works with the network off for every date the snapshot covers.
- **S19.** A rehearsal with the snapshot refreshed the evening before exists and was run (issue 05).

## Implementation Decisions

Decisions D1 to D7 are the owner's. Each states a recommendation; the plan is written for the recommended option.

### D1. Scope (decided by the owner on 2026-11-16)

Real river data from the INA public JSON API and a statistical forecast are IN. HTML scraping stays OUT: the BCR price keeps its placeholder scraper and its default value. No new dependency.

### D2. Draft model (owner decision; recommended)

```text
calado máximo seguro (ft) = 34 - 1,7 × max(0, 2,47 - altura en Rosario (m))
```

- 34 ft and 2,47 m: BCR, cited by Bichos de Campo on 2020-04-08 (opened): the river was "muy por debajo del mínimo de 2,47 metros que tiene que registrarse a la altura de Rosario para que Hidrovía SA tenga la obligación de garantizar el 90% del tiempo los 34 pies de calado". https://bichosdecampo.com/?p=37604
- 1,7 ft per metre: least squares through that anchor and two press reports of April 2020. About 31 ft with the river at about 1 m on 2020-04-07 (same article), and 31'06" at Rosario in MundoMarítimo of 2020-04-13 (opened), a day the INA series reads 0,78 m. The formula gives 31,5 ft and 31,1 ft for those two days.
- It is a model assumption built on two press reports. A third one, 31 ft in early July 2021 with about 0,12 m, comes from a search summary and was not opened; the formula gives 30,0 ft there.
- Constants: `CALADO_CANAL_PIES = 34.0`, `ALTURA_REFERENCIA_M = 2.47`, `PIES_POR_METRO_BAJO_REFERENCIA = 1.7`. `OFFSET_CANAL_M` and `UKC_M` are removed.
- Rejected: keeping the old formula with a larger offset. It fits one of the two April 2020 reports and puts the 34 ft limit at 1,54 m, against the 2,47 m BCR cites.
- Consequence: a vessel whose `calado_diseno_pies` is above 34 (the fictional Supramax, 36 ft) always loads short, at any river height.

### D3. Quequén's `DEMO` extra days: 4 -> 5 (owner decision; recommended)

With realistic tonnages (under 10.000 tn to complete) the old constants make Quequén the best option by default, so the lector's sample no longer changes the decision. With 5 days at both ports, Bahía Blanca is the default best at any tonnage (lower premium) and the sample `quequen-agencia` (3 days, USD 33/tn) always moves it to Quequén. Bahía Blanca's values are unchanged.

### D4. Simulated scenario starts at 1,00 m (owner decision; recommended)

`ALTURA_FALLBACK_M` goes from 3,49 to 1,00. Under D2, 3,49 m is above the reference and the simulated scenario would show no bajante. At 1,00 m it stays a staged bajante (0,94, 0,77 and 0,63 m in the window), labelled as simulated. It is shown only when no INA reading exists for the date.

### D5. Forecast model (owner decision; recommended)

A linear regression per horizon, fitted on anchor days of 1990 to 2018. The nine inputs are, for Rosario, Diamante and La Paz in that order, the change of the daily mean over the last 1, 3 and 7 days. The output is the change at Rosario from the anchor day to `k` days later.

```python
UMBRAL_AGUAS_BAJAS_M = 1.64  # INA: nivel de aguas bajas de Rosario
# Por horizonte (días desde la última lectura): intercepto y luego Rosario, Diamante y La Paz, con rezagos 1, 3 y 7.
COEF_PRONOSTICO = {
    1: (-0.0, 0.1252, -0.0824, -0.0305, -0.009, 0.1037, 0.1062, -0.0179, 0.0439, -0.0096),
    2: (-0.0001, 0.0893, -0.147, -0.0428, -0.0063, 0.1724, 0.1994, -0.007, 0.1182, -0.0154),
    3: (-0.0001, 0.051, -0.1811, -0.0435, 0.0006, 0.1912, 0.2736, 0.0521, 0.2008, -0.0181),
    4: (-0.0002, 0.0419, -0.2179, -0.0315, 0.0011, 0.1892, 0.3299, 0.13, 0.2696, -0.0104),
    5: (-0.0004, 0.0412, -0.2474, -0.0159, -0.0163, 0.199, 0.3708, 0.2294, 0.3199, 0.0007),
}
# P5 y P95 del error del ajuste (m), según la altura del día de la última lectura.
RANGO_PRONOSTICO = {
    "bajo": {1: (-0.09, 0.13), 2: (-0.11, 0.21), 3: (-0.13, 0.24), 4: (-0.19, 0.3), 5: (-0.15, 0.34)},
    "alto": {1: (-0.06, 0.06), 2: (-0.08, 0.09), 3: (-0.1, 0.11), 4: (-0.12, 0.13), 5: (-0.14, 0.15)},
}
```

Measured on 2019-01-01 to 2026-11-15, which the fit never saw (`python .scratch/pronostico-ina/ina.py ajustar` reproduces the constants and this table):

| Days ahead | Cases | Mean error, model | Mean error, "the river does not change" | Readings inside the range |
|---|---|---|---|---|
| 1 | 2.794 | 4,9 cm | 6,1 cm | 81% |
| 2 | 2.789 | 7,5 cm | 10,4 cm | 78% |
| 3 | 2.787 | 9,1 cm | 13,7 cm | 78% |
| 4 | 2.786 | 10,5 cm | 16,4 cm | 80% |
| 5 | 2.784 | 12,4 cm | 19,1 cm | 77% |

With the anchor below 1,64 m (1.270 cases), the 3-day error is 11,3 cm against 15,9 cm.

What can be claimed, and its limits:

- The model cuts the 72 h error by a third against assuming no change. It is a linear regression, not AI.
- The range held about 8 of every 10 real readings; call it that, not a confidence interval.
- In a stable deep bajante the projection is nearly flat: upstream carries little signal there and day-to-day moves of 10 to 20 cm are not anticipated. On 2021-07-17 the model projected +0,01 m for two days later and the river read -0,17 m.
- Why Diamante and La Paz: Rosario alone gives 13,2 cm at 3 days (no real gain); adding Diamante gives 9,5 cm; adding La Paz gives 9,1 cm and helps most in low water. Six more stations tested together only reached 9,0 cm.

### D6. Projection algorithm

`python .scratch/pronostico-ina/ina.py proyectar FECHA [IMO]` is the reference implementation; the API must return the same numbers.

1. Readings by station come from D7.
2. The anchor is the first of `ref`, `ref - 1` and `ref - 2` on which the three stations have a reading on that day and 1, 3 and 7 days before.
3. With no anchor: the simulated scenario (the existing `altura_para` logic and `tipo` rule, starting at `ALTURA_FALLBACK_M`), `proyeccion.origen = "simulada"` and `fuentes.ina = "simulado"`.
4. With an anchor, for each of the 8 days (`ref - 4` to `ref + 3`):
   - Day at or before the anchor: `tipo = "historico"`, the Rosario reading. A day with no reading repeats the latest earlier reading.
   - Day after the anchor: `tipo = "prediccion"`, `k` = days from the anchor. `base` = Rosario at the anchor + intercept + the sum of coefficient × input. `altura_rio_m = round(base, 2)`, `altura_min_m = round(base + P5, 2)`, `altura_max_m = round(base + P95, 2)`, with the regime `"bajo"` when Rosario at the anchor is under 1,64 m. `altura_observada_m` is the Rosario reading of that day when one exists.
5. Draft, tonnage and impact are computed from `altura_rio_m` with the existing functions and D2. `resumen` keeps its three formulas.

Since 2019, 97,4% of days anchor on the day itself and 98,1% within two days. For today the anchor is normally yesterday, so today's height is a 1-day projection and "72 hs" is 4 days from the last reading.

### D7. Data sources (confirmed by the owner on 2026-11-16)

- Endpoint, verified on 2026-11-16 (no auth, about 1,5 s for 36 years): `https://alerta.ina.gob.ar/pub/datos/datos&timeStart=YYYY-MM-DD&timeEnd=YYYY-MM-DD&seriesId={serie}&siteCode={sitio}&varId=39&format=json`. The path is followed by `&`, not `?`. Each item of `data` has `timestart` and `valor`.
- Stations (`siteCode`, `seriesId`): Rosario (34, 26276), Diamante (31, 26273), La Paz (26, 26268). `varId=39` is the daily mean height.
- Snapshot: `python .scratch/pronostico-ina/ina.py historico` writes `api/_ina_historico.py` with `DESDE`, `HASTA` and one list per station (`ROSARIO`, `DIAMANTE`, `LA_PAZ`), one value per day, `None` for a missing reading. It is about 50 KB. It is a generated data module, the one approved exception to "code stays in `api/main.py` and `client/src/App.jsx`".
- The leading underscore is meant to keep the module from being deployed as a function of its own under `api/`. That is an expectation, not something the fetched Vercel docs state; those docs only say Python functions bundle every project file reachable at build time ("Controlling what gets bundled"). Ticket 05's Vercel check confirms it.
- Loading: a static import resolved from the file's own directory, never from the working directory. In `api/main.py`, inside `try / except Exception` that sets the module to `None`: `sys.path.insert(0, str(Path(__file__).parent))`, then `import _ina_historico`.
- The snapshot is the only source of readings. Today keeps an anchor while the snapshot's last day is at most two days back; the INA publishes one day late, so regenerate it the evening before the pitch.
- State: `archivo` when the snapshot gave an anchor; `simulado` when it did not.
- `scrapear_altura_rio`, `INA_URL` and `INA_SELECTOR` are removed: nothing uses them. The BCR scraper is untouched.

### D8. API contract

`GET /api/pronostico-calado` keeps every existing key. Additions:

```json
{
  "fuentes": { "ina": "archivo", "bcr": "simulado" },
  "proyeccion": { "origen": "modelo", "ancla": "2021-07-21" },
  "serie": [
    { "fecha": "2021-07-21", "tipo": "historico", "altura_rio_m": -0.14,
      "altura_min_m": null, "altura_max_m": null, "altura_observada_m": null },
    { "fecha": "2021-07-22", "tipo": "prediccion", "altura_rio_m": -0.15,
      "altura_min_m": -0.24, "altura_max_m": -0.02, "altura_observada_m": -0.21 }
  ]
}
```

- `proyeccion.origen` is `modelo` or `simulada`; `ancla` is null when simulated.
- The three new fields are present on every point and null where they do not apply (always null when simulated).
- With `origen: "modelo"`, `tipo` means reading (`historico`) or model output (`prediccion`), also for past dates.
- `fecha` after today: 422 `La fecha no puede ser posterior a hoy.` `fecha` before 2019-01-09: 422 `No hay lecturas del INA anteriores al 2019-01-09.` The old "7 days ahead" rule is removed.

### D9. Expected results

Fixed values. A mismatch is a finding to report.

`fecha=2021-07-21`, `imo=9436000`: `proyeccion = {origen: modelo, ancla: 2021-07-21}`.

| Fecha | Tipo | Altura | Rango | Observada | Calado | Tonelaje rec. | No cargado | Impacto USD |
|---|---|---|---|---|---|---|---|---|
| 2021-07-17 | historico | 0,07 | | | 29,92 | 36.000 | 9.000 | 3.600.000 |
| 2021-07-18 | historico | 0,03 | | | 29,85 | 35.900 | 9.100 | 3.640.000 |
| 2021-07-19 | historico | -0,17 | | | 29,51 | 35.100 | 9.900 | 3.960.000 |
| 2021-07-20 | historico | -0,15 | | | 29,55 | 35.200 | 9.800 | 3.920.000 |
| 2021-07-21 | historico | -0,14 | | | 29,56 | 35.200 | 9.800 | 3.920.000 |
| 2021-07-22 | prediccion | -0,15 | -0,24 a -0,02 | -0,21 | 29,55 | 35.200 | 9.800 | 3.920.000 |
| 2021-07-23 | prediccion | -0,16 | -0,27 a 0,05 | -0,16 | 29,53 | 35.200 | 9.800 | 3.920.000 |
| 2021-07-24 | prediccion | -0,16 | -0,29 a 0,08 | -0,15 | 29,53 | 35.200 | 9.800 | 3.920.000 |

`resumen`: `tendencia_72hs_m = -0.02`, `perdida_capacidad_tn = 9800`, `lucro_cesante_72hs_usd = 3920000`.

Same date, other vessels: `9321483` loses 700 tn (USD 280.000); `9512277` loses 17.400 tn (USD 6.960.000).

`fecha=2026-11-10`, `imo=9436000`: anchor 2026-11-10, every point with calado 34,00 and 0 tn not loaded. This is the fixed "No desviar" case.

On screen, IMO `9436000`, with D3:

| Scenario | Costs applied | Bahía Blanca: costo / ahorro neto | Quequén: costo / ahorro neto | Mejor opción |
|---|---|---|---|---|
| 2021-07-21 (9.800 tn, lucro cesante USD 3.920.000) | `DEMO` constants | USD 533.200 / +USD 3.386.800 | USD 572.400 / +USD 3.347.600 | Bahía Blanca |
| | `quequen-agencia` | USD 533.200 / +USD 3.386.800 | USD 443.400 / +USD 3.476.600 | Quequén |
| | `recap-broker` | USD 565.300 / +USD 3.354.700 | USD 584.900 / +USD 3.335.100 | Bahía Blanca |
| Simulated (6.900 tn, lucro cesante USD 2.760.000) | `DEMO` constants | USD 434.600 / +USD 2.325.400 | USD 462.200 / +USD 2.297.800 | Bahía Blanca |
| | `quequen-agencia` | USD 434.600 / +USD 2.325.400 | USD 347.700 / +USD 2.412.300 | Quequén |
| | `recap-broker` | USD 460.900 / +USD 2.299.100 | USD 474.700 / +USD 2.285.300 | Bahía Blanca |

Simulated scenario (D4), window of the analysis date: 0,94, 0,77 and 0,63 m; calado 31,40, 31,11 and 30,87 ft; not loaded 5.700, 6.400 and 6.900 tn.

These replace the on-screen table of `.scratch/ai-hackathon/spec.md` D9, whose numbers came from the old simulated heights (13.300 tn). The lector's readings and `probar_lector.py` do not change.

### D10. Frontend

Everything stays in `client/src/App.jsx`, with the existing classes and patterns. No new dependency.

- `PUERTOS_TOP_OFF`: Quequén `diasExtra: 5` (D3).
- `Fuente`: a third state `archivo`, with a sky-blue dot (`bg-sky-600`) and the text of D11.
- Chart data adds, from the new fields, the range (two thin dotted lines in the projection colour, the second with `legendType="none"`) and the observed line (grey, joined to the last reading the way the projection line already is). The Y domain includes them. The tooltip shows the range and the observed value when present.
- The fixed "Escenario crítico" chip becomes the chip of D11, and a caption under the chart carries the D11 texts.
- Height KPI: when the point of the analysis date is `prediccion`, the label and sub-text of D11; the last reading is the point at `proyeccion.ancla`.
- Controls: the date input gets `min="2019-01-09"`; two buttons next to it call the existing `cambiarFecha` with `2021-07-21` and with today.
- The "Datos simulados" badge stays: AIS, the top-off costs and the soy price are still simulated or defaults.

### D11. UI copy (Spanish, verbatim)

| Where | Text |
|---|---|
| Chip, `origen: modelo` | `Datos reales del INA · proyección estadística` |
| Chip, `origen: simulada` | `Escenario simulado` |
| Caption, `modelo` | `Proyección de un modelo estadístico ajustado con lecturas del INA de 1990 a 2018 (Rosario, Diamante y La Paz). En 2019-2026 su error medio a 72 hs fue de 9,1 cm, contra 13,7 cm de suponer que el río no cambia. El rango contuvo cerca de 8 de cada 10 lecturas reales.` |
| Caption, added for a past date with `modelo` | `La proyección usa solo lecturas hasta el {fecha de análisis}. La línea gris muestra lo que ocurrió después.` |
| Caption, `simulada` | `No hay lecturas del INA para esta fecha: se muestra un escenario simulado.` |
| Legend, range | `Rango de la proyección` |
| Legend, observed | `Lo que ocurrió` |
| Tooltip | `Rango: {min} a {max}` and `Ocurrió: {altura}` |
| Height KPI, estimated | label `Altura estimada hoy`, sub-text `Última lectura del INA: {altura} ({fecha})` |
| Date buttons | `Bajante de julio de 2021` and `Hoy` |
| INA indicator, `archivo` | `datos reales (archivo)` |

The `en_vivo` branch of `Fuente` stays as it is; the API no longer returns that state for the INA.

### D12. Git and files

- Branch `feat/pronostico-ina` from the tip of `feat/lector-cotizaciones` (recommended): this work edits the lector's docs and `App.jsx`, and `main` does not have the lector yet. The lector's PR goes first.
- Files: `api/main.py`, `client/src/App.jsx`, the generated `api/_ina_historico.py`, `AGENTS.md`, `README.md`, `docs/hackathon-submission.md`, `.scratch/ai-hackathon/spec.md` and `.scratch/ai-hackathon/issues/05-ensayo-y-plan-b.md`.
- Commit scope: `pronostico`.

## Verification Decisions

- No automated test suite. Checks observe the API response and the screen.
- `python .scratch/pronostico-ina/probar_pronostico.py [base_url]` compares the running API with D9 and the 422 rules, prints today's state and the seconds per call, and exits non-zero on a mismatch. Default base: `http://127.0.0.1:8000/api` (on the owner's machine `localhost` adds about 2 s per call in Python).
- `python .scratch/pronostico-ina/ina.py ajustar` refits from the INA and prints `True` when it reproduces the constants of D5.
- Client: `cd client && npm run lint && npm run build`.

## Out of Scope

- A forecast beyond five days, other gauges, rainfall or dam releases as inputs, the INA's own forecasts.
- Retraining in the API, any numerical or data library (numpy, pandas, statsmodels).
- Live INA reads while the app runs (removed from this plan on 2026-11-16 to keep the MVP small; a later step if the app outlives the pitch).
- Real BCR prices, live AIS, agencia view, automated tests, README roadmap.
- Using Claude to forecast or to explain the forecast.

## Further Notes

Request (owner, 2026-11-16), verbatim:

> La opción 2 choca con el alcance que fijaste. Hoy AGENTS.md y el README dicen que el pronóstico del río está fuera. Acomodá eso

It came with the context of the implementation session, which asked for: "the plan (spec + tickets in `.scratch/<feature>/`), the decisions only the owner can take listed as questions, and then the implementation prompt for the other session."

Owner's answer (2026-11-16), verbatim:

> Si acepto las decisiones siempre y cuando el MVP siga sirviendo y muestre su valor agregado. ACORDATE QUE ES UN MVp

What that answer changed: the recommended option of each question below is confirmed, and the live INA reads (old S5 and the live part of D7, with their ticket) were cut. The value the MVP must show on 2021-07-21 is the real readings, the real loss, the overlay of what the river did, and the measured error; that is why the range and "Lo que ocurrió" stay.

Questions that answer settled:

1. D2: adopt the new draft formula (34 ft at 2,47 m, 1,7 ft per metre below)? It rests on two press reports.
2. D3: raise Quequén's `DEMO` extra days from 4 to 5, so the lector's sample still changes the decision?
3. D4: start the simulated scenario at 1,00 m, so the fallback is still a bajante?
4. D5: ship this model, knowing its projection is nearly flat in a stable deep bajante?
5. D7: accept the generated module `api/_ina_historico.py` as a third code file?
6. D12: branch from `feat/lector-cotizaciones`?
7. Demo: open on today with "No desviar" and jump to 2021-07-21 with the button?

Evidence not opened: the BCR reports themselves (their PDFs are unreadable to the tools; the 2,47 m rule is quoted through the press) and the July 2021 "31 pies" report. Open them before quoting them to the jury.

Slices: 01 scope and draft model; 02 INA readings and projection in the API; 03 chart and the bajante date; 04 docs and pitch lines; 05 rehearsal.
