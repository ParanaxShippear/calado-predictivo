# 03: Gráfico de la proyección y fecha de la bajante

**What to build:** the screen shows what the API now knows. The chart draws the range of the projection and, on a past date, what the river did afterwards. A chip and a caption say where the data comes from and how large the model's error was. The height KPI says when today is an estimate. The INA indicator shows the archive state. Two buttons jump to the bajante of July 2021 and back to today.

**Blocked by:** 02: Lecturas del INA y proyección en la API.

**Status:** ready-for-agent

Spec: `.scratch/pronostico-ina/spec.md` (S10 to S14, S16, S17, S18; D8, D9, D10, D11)

**Files:** `client/src/App.jsx`, `README.md`

- [ ] `Fuente` renders the `archivo` state with a sky-blue dot and "datos reales (archivo)". The other two states are unchanged.
- [ ] The chart draws "Rango de la proyección" as two thin dotted lines from `altura_min_m` and `altura_max_m` (one legend entry), and "Lo que ocurrió" in grey from `altura_observada_m`, joined to the last reading. Both are absent when their values are null. The Y domain includes them.
- [ ] The tooltip adds "Rango: {min} a {max}" and "Ocurrió: {altura}" when the point has them, in es-AR format.
- [ ] The chip next to the chart title follows `proyeccion.origen` with the two texts of spec D11; "Escenario crítico" no longer appears.
- [ ] The caption under the chart follows spec D11: the model text, plus the past-date sentence when `es_pasado`, or the simulated text.
- [ ] The height KPI: when the point of the analysis date is `prediccion`, the label is "Altura estimada hoy" and the sub-text "Última lectura del INA: {altura} ({fecha})", read from the point at `proyeccion.ancla`. Otherwise it is unchanged.
- [ ] The date input has `min="2019-01-09"`. Two buttons with at least 44 px of height, "Bajante de julio de 2021" and "Hoy", call `cambiarFecha` with `2021-07-21` and with today's date.
- [ ] `README.md`, "Funcionalidad": replace the bullets that start with `Altura del río en Rosario` and `Calendario de análisis` with the two below.

```text
- Altura del río en Rosario: 4 días de lecturas reales del INA y la proyección de un modelo estadístico, con su rango. Si el INA todavía no publicó la lectura de hoy, la altura de hoy es una estimación y la interfaz lo indica.
- Calendario de análisis, de 2019 a hoy: una fecha pasada muestra las lecturas reales, la proyección hecha solo con datos hasta ese día y lo que ocurrió después. Un botón lleva a la bajante de julio de 2021.
```

## Verification

```bash
cd client && npm run lint && npm run build
```

UI, with the API of ticket 02 running and `npm run dev`:

1. IMO `9436000` on today's date. The chip reads "Datos reales del INA · proyección estadística". With no reading for today yet, the first KPI reads "Altura estimada hoy" with the last reading and its date under it. The best option is "No desviar".
2. Press "Bajante de julio de 2021". The date field shows 21/07/2021. The KPIs read -0,14 m, 9.800 tn and USD 3.920.000. The chart shows five readings, three projected points (-0,15, -0,16 and -0,16 m), the two range lines and the grey line "Lo que ocurrió" (-0,21, -0,16 and -0,15 m). The caption includes "La proyección usa solo lecturas hasta el miércoles 21/07…" in the format the screen already uses for dates.
3. The tooltip of 22/07 shows the height, "Rango: -0,24 m a -0,02 m" and "Ocurrió: -0,21 m".
4. The INA indicator reads "datos reales (archivo)".
5. The comparison shows Bahía Blanca as the best option (USD 533.200, +USD 3.386.800). Reading and applying "Cotización de agencia: Quequén" moves it to Quequén (USD 443.400, +USD 3.476.600). Issue the order and download the CSV.
6. Press "Hoy": the screen is back to step 1.
7. Pick 10/10/2019 in the calendar (a date with no INA readings): the chip reads "Escenario simulado", the caption reads "No hay lecturas del INA para esta fecha: se muestra un escenario simulado.", the INA indicator reads "valor por defecto", and the chart has no range and no grey line.
8. The calendar does not offer dates before 09/01/2019 or after today.
9. At 390 px of width the controls wrap without overflowing.
