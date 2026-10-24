# 01: Etiquetado demo

**What to build:** the dashboard labels everything simulated, so nobody mistakes the demo for live data. One visible "datos de demo" badge, an AIS indicator that never shows green (with or without a linked vessel), and an "escenario crítico" label on the projection. Demo values stay as named constants marked `DEMO`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

Spec: `.scratch/top-off-demo/spec.md`

- [ ] The "datos de demo" badge is visible on load, once, while any source is simulated.
- [ ] The AIS indicator is never green: checked before linking an IMO and after linking `9436000`.
- [ ] The INA and BCR indicators keep showing the state the API reports (yellow `simulado` on fallback); no live claim is added.
- [ ] The "escenario crítico" label is visible on the chart section.
- [ ] The default vessel is still the Panamax and the demo never requires linking an IMO.
- [ ] `npm run lint` and `npm run build` pass, and the CSV export still works.
