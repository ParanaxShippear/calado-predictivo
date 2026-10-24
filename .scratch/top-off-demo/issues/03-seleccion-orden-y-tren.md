# 03: Selección conectada a la orden, KPI y limpieza de "por tren"

**What to build:** the user can select any row of the top-off table, including "no desviar", and the order, its confirmation text and the Ahorro Logístico Asegurado KPI all follow the selected option and name the selected port. "Por tren" and "logística terrestre reservada" disappear from the whole UI, and the 3 "por tren" mentions in the README are corrected.

**Blocked by:** 02: Tabla de top-off con "no desviar".

**Status:** ready-for-agent

Spec: `.scratch/top-off-demo/spec.md`

- [ ] Any row can be selected; the best option is preselected again whenever the date or the vessel changes, and the order state resets.
- [ ] Issuing the order with Bahía Blanca selected names Bahía Blanca, and with Quequén selected names Quequén; never a fixed port. The text states the vessel is diverted south to complete cargo. The order number stays a `DEMO` constant.
- [ ] The Ahorro Logístico Asegurado KPI uses the selected option's ahorro neto and names that port.
- [ ] With "no desviar" selected, the button reads "Registrar decisión: no desviar"; pressing it shows "Decisión registrada: no desviar" (on screen only, no order number, no persistence).
- [ ] Searching `App.jsx` for "tren" and "logística terrestre" finds nothing in user-visible text.
- [ ] The 3 "por tren" mentions in the README (feature list, pitch quote, diagram) are corrected; the README roadmap is untouched.
- [ ] `npm run lint` and `npm run build` pass, and the CSV export still works.
