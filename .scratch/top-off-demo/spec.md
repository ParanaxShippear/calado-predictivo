Status: ready-for-agent

Amended 2026-10-24 by the owner: the badge reads "datos simulados", the assumptions text under the top-off table was removed from the UI, and the system is called Paranax, and the UI asks for the IMO first and shows no data until one is linked (stories 20 and the "Panamax por defecto" line no longer apply; the demo uses IMO `9436000`). See `.scratch/ui-improvements/spec.md`.

# Spec: Top-off comparison and demo labelling

## Problem Statement

The agroexportadora sees a bajante coming in 72 h and a lucro cesante figure in USD, but the dashboard answers "what do I do?" with a single hardcoded option (Bahía Blanca, USD 450,000, "por tren"). That has three problems for the demo:

- It implies cargo travels by train from Rosario, which no source supports.
- It never compares ports and never shows the case where diverting does not pay.
- Simulated data is not labelled as demo, and the AIS indicator turns green when an IMO is linked, even though AIS is always simulated.

## Solution

One dashboard, golden path: hoy -> gráfico -> lucro cesante -> comparación de top-off -> CSV.

The top-off panel compares Bahía Blanca (priority 1), Quequén (priority 2) and a "no desviar" row. Each row shows cost and ahorro neto. The best option is marked. The user can select any row, including "no desviar". Issuing the order names the selected port. Everything simulated is labelled: one "datos simulados" badge, an AIS indicator that is never green, a "escenario crítico" label, and the assumptions as text under the table.

## User Stories

1. As an agroexportadora planner, I want a visible "datos simulados" badge, so that nobody mistakes the demo numbers for live data.
2. As an agroexportadora planner, I want the AIS indicator to never show green, so that simulated vessel data is never presented as live.
3. As an agroexportadora planner, I want the INA and BCR indicators to keep reflecting what the API reports (`simulado` yellow on fallback), so that I never see a live claim the system cannot back.
4. As an agroexportadora planner, I want the projection labelled "escenario crítico", so that the audience knows the bajante is a staged scenario.
5. As an agroexportadora planner, I want a top-off table with Bahía Blanca and Quequén, so that I can compare where to complete the cargo.
6. As an agroexportadora planner, I want each port row to show cost and ahorro neto, so that I can see which port pays.
7. As an agroexportadora planner, I want the best option marked, so that the decision is obvious in the demo.
8. As an agroexportadora planner, I want a "no desviar" row, so that I can see when diverting does not pay.
9. As an agroexportadora planner, I want "no desviar" to be the marked best option when every port has a negative ahorro neto, so that the tool does not push a losing diversion.
10. As an agroexportadora planner, I want to select any row, including "no desviar", so that I can override the recommendation.
11. As an agroexportadora planner, I want the best option preselected, so that the golden path takes one click.
12. As an agroexportadora planner, I want the cost split into días extra de buque and premio del grano en el puerto, so that I understand what drives it.
13. As an agroexportadora planner, I want the assumptions as text under the table, so that nobody asks "where does that number come from?" without an answer on screen.
14. As an agroexportadora planner, I want the text to say the vessel loads partially at Gran Rosario and sails south to complete its cargo, so that the mechanic is stated correctly.
15. As an agroexportadora planner, I want no mention of "por tren" or "logística terrestre reservada" anywhere in the UI, so that I never claim something unsupported.
16. As an agroexportadora planner, I want the order confirmation to name the selected port, so that the message matches my decision.
17. As an agroexportadora planner, I want "no desviar" to be recorded as a decision (button "Registrar decisión: no desviar", confirmation "Decisión registrada: no desviar", no cost and no saving), so that not diverting is also a visible decision. It is on-screen only: nothing persists.
18. As an agroexportadora planner, I want the Ahorro Logístico Asegurado KPI to use the selected port's ahorro neto and name that port, so that the KPI and the order agree.
19. As an agroexportadora planner, I want changing the date or the vessel to reset the order state and recompute the table, so that stale orders never show.
20. As an agroexportadora planner, I want the Panamax as the default vessel, so that nobody has to link an IMO in the demo.
21. As an agroexportadora planner, I want the CSV export to keep working on every commit, so that the golden path ends reliably.
22. As the presenter, I want the demo values to be named constants marked `DEMO`, so that the team can tune the numbers before the pitch.
23. As the presenter, I want a rehearsed run of the golden path, so that the 3-minute demo has no surprises.
24. As the presentation team, I want the script, numbers and Q&A prepared by us, so that devs only build the product.

## Implementation Decisions

- Frontend only. No new endpoint, no destinations table in the API. The API contract does not change.
- Top-off options are frontend constants, each marked `DEMO`: two ports in priority order (Bahía Blanca, Quequén) plus the "no desviar" row. Buenos Aires is not an option.
- Cost per port has exactly two components: días extra de buque (days × daily vessel cost) and premio del grano en el puerto de completamiento (USD/tn × tonnes topped off). No other component.
- Starting values: daily vessel cost USD 40,000; Bahía Blanca 5 extra days and USD 34/tn premium, within the maize premium observed by Sio Granos for Bahía Blanca over Gran Rosario (~USD 40/t in Jul-2021, ~USD 32/t in Feb-2022, per Bichos de Campo), labelled "referencia" with that source in the visible assumptions; the 5 extra days are not sourced, so they are labelled "demo"; Quequén 4 extra days (fewer than Bahía Blanca) and USD 38/tn premium, invented values labelled "demo". With the current critical scenario (~13,300 tn) that gives roughly USD 650k for Bahía Blanca and USD 665k for Quequén, both well below the lucro cesante avoided. Bahía Blanca wins by a small margin, so the Quequén premium must stay above ~USD 37/tn for it to remain the best option.
- Tonnes topped off and the gross benefit reuse the existing worst-day logic of the 72 h window (tonelaje no cargado and impacto of that day). Ahorro neto = gross benefit − cost. "No desviar" has cost 0 and ahorro neto 0, which is the floor. The best option is the highest ahorro neto, so "no desviar" wins whenever every port is negative (for example, a date with a small loss).
- The existing hardcoded `COSTO_DESVIO_USD` (450,000) is replaced by the per-port model.
- Selection state: the best option is preselected on every recompute; the user may select another row. The order, the confirmation text and the KPI all read the selected row.
- Order confirmation names the selected port and states the mechanic: the vessel is diverted south to complete cargo. The order number stays a `DEMO` constant. "Por tren" and "Logística terrestre reservada" are removed from every UI string, including the simulator title ("Completar X tn por tren") and the KPI/order texts.
- Selecting "no desviar" turns the button into "Registrar decisión: no desviar". Pressing it shows "Decisión registrada: no desviar" and the KPI sub-text reads "Sin desvío: no hay costo ni ahorro de top-off". No order number and no persistence (an endpoint is OUT of scope).
- "datos simulados" badge: one visible badge in the header, shown while any source is simulated (today always, since the previous days, the projection, AIS and the port costs are demo).
- AIS indicator: never green. It shows a simulated state both with and without a linked vessel. The IMO search stays as it exists today but the demo never uses it. No new AIS features.
- INA and BCR indicators: unchanged, the API state is shown as is. The failure fallback keeps the `simulado` yellow state.
- "escenario crítico" label: shown on the chart section while the projection is the staged bajante (always, today).
- Assumptions under the top-off table, as visible text: 2,200 tn per foot of draft, 45,000 tn base load shown as "Panamax de referencia, 45.000 tn (supuesto del modelo; la BCR cita Panamax de 60.000 a 65.000 tn)", "calado de diseño del Panamax (supuesto)" of 34 ft (pies faltantes = 34 − calado seguro; never shown as a bare "34 pies", not the Buenos Aires draft nor the 34 ft guaranteed channel draft cited by BCR), the per-port costs (Bahía Blanca values marked "referencia" with their source, Quequén values marked "demo"), and the partial-load-then-sail-south mechanic. AGENTS.md remains the single source for the model numbers.
- All UI copy in Spanish, domain terms verbatim: calado, bajante, falso flete, lucro cesante, Panamax, top-off, IMO, INA, BCR, AIS.
- CSV export is unchanged. It must keep working on every commit.

## Testing Decisions

- One seam: the running dashboard. No automated tests (OUT by AGENTS.md). A good check observes external behavior only: what the screen shows and what the export contains.
- Prior art: none. The repo has no test suite; verification is lint, build, curl and the UI, as in AGENTS.md.
- Verification, all with observed results:
  1. `cd client && npm run lint && npm run build` pass.
  2. API up, `curl localhost:8000/api/pronostico-calado` returns the unchanged contract.
  3. Search `App.jsx` for "tren": no match in any user-visible text. Also check "logística terrestre".
  4. The "datos simulados" badge is visible on load.
  5. The AIS indicator is never green: check before linking an IMO and after linking `9436000`.
  6. Issue the order with each port selected: the confirmation names that port (Bahía Blanca and Quequén), never a fixed one.
  7. The "no desviar" row appears and can be selected; with it selected the button reads "Registrar decisión: no desviar" and pressing it shows the decision as recorded. Also check a date where every port is negative and "no desviar" is marked best (con el Panamax por defecto no existe, porque su pérdida nunca llega a cero; usar el Handymax IMO `9321483` el 2026-10-04).
  8. The "escenario crítico" label and the assumptions text under the table are visible.
  9. Golden path end to end, including the CSV download.

## Out of Scope

Real scraping, ML/LLM, live AIS, agencia view, automated tests, README roadmap, new features, a new endpoint or destinations table, extra cost components, Buenos Aires as an option.

STRETCH (pitch only, not the product): an agencia slide.

If someone proposes something outside IN, the answer is no.

## Further Notes

Deliverables for the presentation team, not devs: script, numbers and Q&A for the pitch; demo rehearsal.

Request, verbatim:

> Pitch: Calado Predictivo convierte una bajante del Paraná a 72 h en lucro cesante en USD y en una decisión de top-off, con fuentes públicas y escenario hidrométrico etiquetados como demo.
>
> Minuto 3 del demo: hoy -> gráfico -> lucro cesante -> comparación de top-off (Bahía Blanca, Quequén) -> CSV. Un solo dashboard. Panamax por defecto. Nadie vincula un IMO. Nadie dice que INA/BCR o un modelo de IA están en vivo.

The README says "por tren" in three places (feature list, pitch quote, diagram). Correcting those three mentions is part of slice (c). The README roadmap stays untouched.

Suggested slices for `to-tickets`, each closable in under 30 minutes: (a) demo labelling: badge, AIS never green, escenario crítico; (b) top-off table with constants, best marking, "no desviar" and visible assumptions; (c) selection wired to order, confirmation text and KPI, plus removal of "por tren" from the UI and the 3 README mentions; (d) rehearsal.
