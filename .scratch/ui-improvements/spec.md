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
