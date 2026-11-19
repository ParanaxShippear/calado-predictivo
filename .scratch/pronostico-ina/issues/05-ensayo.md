# 05: Ensayo con datos reales

**What to build:** a rehearsed demo on real river data: the snapshot refreshed the day before, the forecast checked on the deploy, the offline path observed, and the lines the presenter says about the river.

**Blocked by:** 04: Documentación y guion.

**Status:** ready-for-human

Spec: `.scratch/pronostico-ina/spec.md` (S17, S18, S19; D5, D9)

The steps marked (human) need the owner. An agent can run the rest. Write every observed result under `## Resultados observados`; report a failure instead of hiding it. The lector's rehearsal stays in `.scratch/ai-hackathon/issues/05-ensayo-y-plan-b.md`.

## Rehearsal checks

- [x] `python .scratch/pronostico-ina/ina.py ajustar` ends with `igual a las constantes de este archivo: True`. A `False` means the INA revised old readings: report the printed constants, change nothing.
- [x] `python .scratch/pronostico-ina/probar_pronostico.py` prints `fallas=0`. Record `fuentes.ina` and the seconds of the lines for 2021-07-21 and for today.
- [ ] (human) The evening before the pitch: `python .scratch/pronostico-ina/ina.py historico`, restart uvicorn, run the script again, and commit `api/_ina_historico.py` with the subject `chore(pronostico): refresh the INA snapshot`. The line for today must show `proyeccion={'origen': 'modelo', ...}`: a snapshot more than two days old makes today fall to the simulated scenario.
- [ ] (human) Vercel, must pass before showing the deployed app: `python .scratch/pronostico-ina/probar_pronostico.py https://<deploy-url>/api` prints `fallas=0`, with `fuentes.ina=archivo` for 2021-07-21. `simulado` there means the snapshot did not load on the deploy: present from the local laptop and report it. The local demo does not depend on this check.
- [ ] (human) Network off, local API: the button "Bajante de julio de 2021" shows the numbers of spec D9 at once. Today shows the model's projection when the snapshot is at most two days old, and "Escenario simulado" otherwise. Record which one and the seconds it took.
- [ ] UI walk-through of ticket 03, steps 1 to 6, ending with the order issued and the CSV saved. Done up to the order issued; the saved CSV file was not observed (see the results).
- [x] `cd client && npm run lint && npm run build` pass.

## Plan B on stage

| Situation | Presenter does | Presenter says |
|---|---|---|
| Today shows "Escenario simulado" (the snapshot is more than two days old) | Press "Bajante de julio de 2021" and carry on from there | "Hoy es un escenario simulado: la etiqueta lo dice. La bajante de 2021 sí son lecturas reales." |
| The deployed app shows "Escenario simulado" on 2021-07-21 | Switch to the local laptop | Nothing |
| A juror asks for another date | Pick it in the calendar; the grey line shows what happened | "La proyección usa solo datos hasta ese día." |

For questions only, a date that shows the model anticipating: 2023-06-02 (its loss is 500 tn, too small to open the demo with). The river reads 2,60 m (no loss) and the model projects 2,34 m in three days, under the 2,47 m reference; the river then read 2,29 m.

## What to say about the river

- One sentence: "Las alturas son lecturas reales del INA. La proyección es de un modelo estadístico entrenado con 1990 a 2018; en 2019 a 2026, que nunca vio, erró en promedio 9 centímetros a 72 horas, contra casi 14 de suponer que el río no cambia."
- "¿Es IA?" -> "No. Es una regresión con las lecturas de Rosario, Diamante y La Paz. La IA del producto es el lector de cotizaciones."
- "¿Acertó en 2021?" -> "El 21 de julio proyectó entre -0,15 y -0,16 metros y el río marcó -0,21, -0,16 y -0,15. En una bajante estable proyecta que el río sigue donde está; no anticipa los saltos de un día para el otro."
- "¿De dónde sale el calado?" -> "34 pies cuando Rosario marca 2,47 metros o más, que es la referencia que cita la BCR, y 1,7 pies menos por cada metro por debajo. Ese 1,7 es un supuesto nuestro, ajustado con dos reportes de abril de 2020."
- "¿Por qué hoy dice no desviar?" -> "Porque hoy el río está alto. El producto también dice cuándo no hace falta."

## Resultados observados

Run on 2026-11-19, local API on `127.0.0.1:8000`, snapshot `2019-01-01` to `2026-11-18` (generated that day).

- `ina.py ajustar`: ended with `igual a las constantes de este archivo: True`. At 3 days: model 9,1 cm, "no change" 13,7 cm, range held 78%; with the anchor below 1,64 m (1.270 cases), 11,3 cm against 15,9 cm. The run took 9,6 s with the INA.
- `probar_pronostico.py`: `fallas=0`, every line `OK`.
  - 2021-07-21: `fuentes.ina=archivo`, 3,0 s on the last run (4,3 s on the first run after a restart).
  - Today (2026-11-19): `fuentes.ina=archivo`, `proyeccion={'origen': 'modelo', 'ancla': '2026-11-18'}`, 0,0 s.
  - The seconds on 2021-07-21 were not isolated; they may include the BCR placeholder scraper's timeout, which is cached for 5 minutes (not verified).
- Snapshot missing (file renamed, API restarted): `{'origen': 'simulada', 'ancla': None} simulado`. File restored.
- `probar_lector.py`: three `OK` lines, `fallas=0`.
- `npm run lint`: 0 errors, 1 warning (`react(set-state-in-effect)` in `App.jsx`, in the effect that existed before this work). `npm run build`: passes.
- UI walk-through (ticket 03 steps 1 to 9, in the built-in browser with `npm run dev`):
  - Step 1: chip "Datos reales del INA · proyección estadística"; KPI "ALTURA ESTIMADA HOY" 4,87 m with "Última lectura del INA: 4,86 m (miércoles 18/11)"; best option "No desviar".
  - Step 2: date 21/07/2021; KPIs -0,14 m, 9.800 tn, USD 3.920.000; five readings, three projected points, the two range lines and the grey line; the caption ends with "La proyección usa solo lecturas hasta el miércoles 21/7. La línea gris muestra lo que ocurrió después." (the screen writes the date as 21/7).
  - Step 3: tooltip of 22/7: "Altura: -0,15 m", "Rango: -0,24 m a -0,02 m", "Ocurrió: -0,21 m".
  - Step 4: "INA (Río): datos reales (archivo)".
  - Step 5: Bahía Blanca best (USD 533.200, +USD 3.386.800); after reading and applying "Cotización de agencia: Quequén" (stored reading, no API key): Quequén best, USD 443.400, +USD 3.476.600. Order issued ("Emitida el 19/11/26, 6:58 p. m."). The "Descargar (CSV)" button was pressed with no error; the file on disk was not observed, so the saved CSV is still pending, as in the lector's rehearsal.
  - Step 6: "Hoy" brings back step 1 (date 2026-11-19, "No desviar").
  - Step 7: 2019-10-10: chip "Escenario simulado", the caption of D11, "INA (Río): valor por defecto", legend without range or grey line.
  - Step 8: the input has `min="2019-01-09"` and `max="2026-11-19"`; the calendar popup was not opened.
  - Step 9: at 390 px, `scrollWidth` equals the viewport width (390): no horizontal overflow.

Pending (human): refresh the snapshot the evening before the pitch, Vercel check, network off.
