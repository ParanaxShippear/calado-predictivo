# 02: Panel del lector en el Simulador Top-off

**What to build:** the lector section inside the Simulador Top-off card, working end to end on the fallback of ticket 01. The user loads a sample or pastes a document, presses "Leer con IA", sees the proposal (five editable values, each with its cita, and the origin label), and applies it. The comparison table, the best option, the KPI and the order of diversion recompute with the applied costs. "Volver a los costos demo" restores the constants. With this ticket the demo already runs with no key: it is the plan B path.

**Blocked by:** 01: Endpoint de lectura con respuestas precargadas.

**Status:** ready-for-agent

Spec: `.scratch/ai-hackathon/spec.md` (S9 to S15, S16, S19; D7, D9, D10, D11)

**Files:** `client/src/App.jsx`, `README.md`

- [ ] A `LectorCotizacion` component renders under the top-off table with the copy of spec D11: title, help text, one button per sample under "Documentos de ejemplo (ficticios):", a labelled text area and the "Leer con IA" button (`Leyendo…` while it waits, disabled with empty text).
- [ ] The samples come from `GET /cotizaciones-ejemplo`. If that request fails, no sample buttons are shown and the text area still works.
- [ ] After a reading, the proposal shows the origin label for `ia`, `precargado` and `sin_ia` with the `{motivo}` text of spec D11, the five fields prefilled with the returned values, the cita under each value that has one, the warning for a cita that is not verified, and every entry of `advertencias`.
- [ ] A network error or a 15 s abort shows the `sin_ia` state with "no pudimos conectar con el servicio" and empty fields.
- [ ] "Aplicar a la comparación" is enabled with at least one value and every filled field inside its range (spec D6); a field out of range shows "Valor fuera de rango." "Descartar" closes the proposal without changing the comparison.
- [ ] Applying sets `costosCotizacion` in `App` (shape in spec D10), preselects the best option again and resets an issued order. Fields without a value keep their `DEMO` constant. A second apply replaces the first.
- [ ] The table shows "Según cotización" on the ports that use applied costs and a "Volver a los costos demo" button while costs are applied. Applied costs survive a date change and are cleared when the vessel is unlinked.
- [ ] The whole lector is disabled once the order is issued.
- [ ] The sentence "La IA solo lee el documento. El costo y el ahorro neto se calculan con una fórmula fija." is visible under the lector.
- [ ] Touch targets are at least 44 px, every field has a label, and the proposal is announced with `role="status"`, as in the rest of `App.jsx`.
- [ ] `README.md`: "Funcionalidad" gains one bullet describing the lector (paste a document, the values are proposed with their cita, the user confirms, the comparison recomputes), stating that in this state the readings are the stored ones.

## Verification

```bash
cd client && npm run lint && npm run build
```

Expected: lint with 0 errors (the existing `react(set-state-in-effect)` warning may remain) and a successful build.

UI, with the API of ticket 01 running and `npm run dev`:

1. Enter IMO `9436000`. Before touching the lector, the best option is Bahía Blanca: USD 652.200 de costo, +USD 4.667.800 de ahorro neto. Quequén: USD 665.400 and +USD 4.654.600.
2. Press the sample "Cotización de agencia: Quequén", then "Leer con IA". The label reads "Lectura precargada: en este intento no se usó IA (falta instalar el SDK de IA)." Quequén shows 3 días extra and USD 33/tn with their citas; the other three fields are empty.
3. Press "Aplicar a la comparación". Quequén becomes the best option: USD 558.900 de costo, +USD 4.761.100 de ahorro neto, tagged "Según cotización". Bahía Blanca is unchanged. The order names Quequén and its line reads "Días extra de buque (3)".
4. Press "Volver a los costos demo": the numbers of step 1 return.
5. Apply the sample "Recap del broker: costo diario y Bahía Blanca": Bahía Blanca USD 691.300 and +USD 4.628.700; Quequén USD 675.400 and +USD 4.644.600; best option Quequén.
6. Read the sample "Documento que no es una cotización": five empty fields and "Aplicar a la comparación" disabled.
7. Type any text that is not a sample and read it: the label reads "No se pudo leer con IA (falta instalar el SDK de IA). Cargá los valores a mano." Type 2 in "Días extra de buque" of Bahía Blanca and apply: Bahía Blanca costs USD 532.200.
8. Type 99 in a días field: "Valor fuera de rango." and the apply button is disabled.
9. Change the date and come back: the applied costs are still there. Unlink the vessel and link it again: the `DEMO` costs are back.
10. Issue the order: the lector is disabled.
11. Golden path through the CSV download still works.
