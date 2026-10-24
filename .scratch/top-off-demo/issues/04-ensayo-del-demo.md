# 04: Ensayo del demo

**What to build:** a full rehearsal of the golden path (hoy -> gráfico -> lucro cesante -> comparación de top-off -> orden -> CSV) with every check observed and written down, so the demo has no surprises. The pitch script, numbers and Q&A are prepared by the presentation team, not by this ticket.

**Blocked by:** 01: Etiquetado demo, 03: Selección conectada a la orden, KPI y limpieza de "por tren".

**Status:** ready-for-agent

Spec: `.scratch/top-off-demo/spec.md`

- [ ] `cd client && npm run lint && npm run build` pass.
- [ ] With the API running, `curl localhost:8000/api/pronostico-calado` returns the unchanged contract.
- [ ] Searching `App.jsx` for "tren" finds nothing in user-visible text.
- [ ] The "datos de demo" badge is visible on load.
- [ ] The AIS indicator is never green, before and after linking `9436000`.
- [ ] The order confirmation names the selected port for both Bahía Blanca and Quequén, never a fixed one.
- [ ] The "no desviar" row appears and can be selected; with it selected the order button is disabled. A date where every port is negative marks "no desviar" as best.
- [ ] The "escenario crítico" label and the assumptions text under the table are visible.
- [ ] The golden path works end to end, including the CSV download.
- [ ] The observed result of each check is recorded in this file, and any failure is reported rather than hidden.
