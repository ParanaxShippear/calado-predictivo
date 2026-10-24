Status: ready-for-agent

# Spec: UI improvements from the Impeccable audit and critique

Request, verbatim: "necesito diseñar la UI y mejorarla" and, when offered the small accessibility fixes and the decision-hierarchy redesign, "todo".

Scope decision: this goes beyond the closed hackathon scope in AGENTS.md. The project owner approved it. It is frontend only, with no new endpoint, no new dependency and no change to the golden path or to the rules already in AGENTS.md (datos de demo badge, AIS never green, no "por tren", assumptions visible, UI copy in Spanish).

## Findings it responds to

Audit 13/20 (accessibility 2, performance 3, theming 2, responsive 3, integrity 3) and a design critique, run on 2026-10-24 against `client/src/App.jsx` with the Impeccable skill (detector, browser measurements at 1400 px and 390 px).

## Changes

1. Document and accessibility
   - `lang="es"` and a real page title instead of "client".
   - A `<main>` landmark, `scope="col"` on table headers, a label for the IMO input.
   - Status of INA, BCR and AIS written as visible text, not only a tooltip and a colour.
   - Touch targets of at least 44 px for buttons and for the top-off options.
2. Contrast: every text meets 4.5:1 (the key figures measured 2.99:1 to 3.91:1).
3. Number formats: one locale (es-AR) for tonnes, metres and USD, written "USD 5.320.000" and "3,49 m". The CSV export keeps its current format.
4. Decision hierarchy
   - The best top-off option is shown as a headline with its ahorro neto.
   - The order button sits right under the table; the assumptions follow it as a footnote, still visible text.
   - On narrow screens the Centro de Decisiones comes before the chart.
   - Text of 12 px is limited to captions; costs and amounts are larger.
5. Chart: title "Altura del río: histórico vs. proyección" (it plots metres, not the calado), a caption stating that the vertical scale is cropped, and chart colours defined once.
6. Consistency: icons replace the emoji (status dots, lightbulb, check).
7. Cleanup: remove the unused Vite template styles (`App.css`).

## Out of scope

Dark mode and a token system, new features, any change to the API, the model or the demo data.

## Verification

`npm run lint` and `npm run build` pass; `impeccable detect` and the contrast measurement show no real failures; the golden path rehearsal (spec `top-off-demo`) still passes; screenshots at 1400 px and 390 px reviewed.

## Amendment (2026-10-24, owner)

- The badge reads "datos simulados" instead of "datos de demo".
- The assumptions section under the top-off table is removed from the UI: the client is not interested in it. Item 4 above ("the assumptions follow it as a footnote") no longer applies. The assumptions stay documented in `README.md` and `AGENTS.md`.
- The system is called Paranax (header, page title, README, API title). The repository keeps its name.
- The first screen asks for the IMO ("Ingresá el IMO de tu buque") and shows no data or numbers, only the "datos simulados" badge. Nothing is requested from the API until a valid IMO is linked. Errors read: 7 digits expected, IMO not found, service unreachable. Unlinking the vessel returns to that screen. The demo uses IMO `9436000`.
- The title reads "Paranax - Calado predictivo y unificado" (header and page title).
- The caption about the cropped vertical scale under the chart is removed.
- The sentence "El buque carga parcialmente en el Gran Rosario y navega al sur para completar X tn en el puerto elegido" is removed from the top-off panel (it was the on-screen statement of the mechanic, story 14 of the top-off spec). The mechanic stays documented in `AGENTS.md` and the README, and the rule of never implying a train still applies.
- Approved by the owner: emitting a top-off order shows an on-screen document "Orden de desvío" addressed to the agencia marítima: order number, issue date, vessel and IMO, the instruction (leave Gran Rosario with the partial load, complete the rest at the selected port), the reason (calado seguro previsto), the estimated cost split and ahorro neto, and the status "enviada a la agencia marítima", with the footer "Documento generado por Paranax con datos simulados". It is not shown for "no desviar". Nothing is sent or stored.
- Approved by the owner (2026-10-24), dashboard rework:
  - The "Arbitraje Logístico" block and the "Recomendación de carga" table (3 days) are removed. The 3-day forecast lives in the order as an annex.
  - The order document is always visible as a draft ("Borrador") that follows the selected option, sits in a sticky right column and is issued from its own footer ("Emitir Orden de Desvío"; "Registrar decisión: no desviar" for the no-desviar option). After issuing it reads "Enviada a la agencia marítima" (or "Decisión registrada").
  - The economics read as an operation: "+ Lucro cesante evitado", "− Días extra de buque", "− Premio del grano", "= Ahorro neto estimado", with the total top-off cost beside the heading.
  - Weekdays are always written in full ("Martes 27/10", "el martes 27/10"), including the chart axis.
  - Layout: chart and simulator on the left, order on the right; on narrow screens simulator, order, then chart.
  - The CSV is downloaded from the annex of the order ("Descargar (CSV)"), and now carries the vessel name and IMO columns.
