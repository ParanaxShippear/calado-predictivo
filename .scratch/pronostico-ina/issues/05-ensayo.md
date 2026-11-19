# 05: Ensayo con datos reales

**What to build:** a rehearsed demo on real river data: the snapshot refreshed the day before, the forecast checked on the deploy, the offline path observed, and the lines the presenter says about the river.

**Blocked by:** 04: Documentación y guion.

**Status:** ready-for-human

Spec: `.scratch/pronostico-ina/spec.md` (S17, S18, S19; D5, D9)

The steps marked (human) need the owner. An agent can run the rest. Write every observed result under `## Resultados observados`; report a failure instead of hiding it. The lector's rehearsal stays in `.scratch/ai-hackathon/issues/05-ensayo-y-plan-b.md`.

## Rehearsal checks

- [ ] `python .scratch/pronostico-ina/ina.py ajustar` ends with `igual a las constantes de este archivo: True`. A `False` means the INA revised old readings: report the printed constants, change nothing.
- [ ] `python .scratch/pronostico-ina/probar_pronostico.py` prints `fallas=0`. Record `fuentes.ina` and the seconds of the lines for 2021-07-21 and for today.
- [ ] (human) The evening before the pitch: `python .scratch/pronostico-ina/ina.py historico`, restart uvicorn, run the script again, and commit `api/_ina_historico.py` with the subject `chore(pronostico): refresh the INA snapshot`. The line for today must show `proyeccion={'origen': 'modelo', ...}`: a snapshot more than two days old makes today fall to the simulated scenario.
- [ ] (human) Vercel, must pass before showing the deployed app: `python .scratch/pronostico-ina/probar_pronostico.py https://<deploy-url>/api` prints `fallas=0`, with `fuentes.ina=archivo` for 2021-07-21. `simulado` there means the snapshot did not load on the deploy: present from the local laptop and report it. The local demo does not depend on this check.
- [ ] (human) Network off, local API: the button "Bajante de julio de 2021" shows the numbers of spec D9 at once. Today shows the model's projection when the snapshot is at most two days old, and "Escenario simulado" otherwise. Record which one and the seconds it took.
- [ ] UI walk-through of ticket 03, steps 1 to 6, ending with the order issued and the CSV saved.
- [ ] `cd client && npm run lint && npm run build` pass.

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

(pending)
