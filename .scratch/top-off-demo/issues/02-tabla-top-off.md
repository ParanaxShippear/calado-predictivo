# 02: Tabla de top-off con "no desviar"

**What to build:** the fixed Bahía Blanca simulator becomes a comparison table: Bahía Blanca (priority 1), Quequén (priority 2) and a "no desviar" row. Each row shows cost (días extra de buque + premio del grano en el puerto, only those two components) and ahorro neto. The best option is marked and preselected. Visible assumptions go as text under the table. The mechanic is stated correctly: the vessel loads partially at Gran Rosario and sails south to complete its cargo. All values are frontend constants marked `DEMO`; no new endpoint, no destinations table in the API.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

Spec: `.scratch/top-off-demo/spec.md`

- [ ] Constants: daily vessel cost USD 40,000; Bahía Blanca 5 extra days and USD 34/tn premium; Quequén 4 extra days and USD 38/tn premium. Buenos Aires is not an option.
- [ ] Tonnes topped off and gross benefit reuse the existing worst-day logic of the 72 h window. Ahorro neto = gross benefit − cost. "No desviar" has cost 0 and ahorro neto 0.
- [ ] The best option (highest ahorro neto) is marked; with the current critical scenario it is Bahía Blanca. On a date where every port is negative, "no desviar" is marked best (con el Panamax por defecto no existe, porque su pérdida nunca llega a cero; usar el Handymax IMO `9321483` el 2026-10-04).
- [ ] Assumptions are visible as text under the table: 2,200 tn per foot of draft; "Panamax de referencia, 45.000 tn (supuesto del modelo; la BCR cita Panamax de 60.000 a 65.000 tn)"; "calado de diseño del Panamax (supuesto)" of 34 ft, never shown as a bare "34 pies"; the Bahía Blanca premium labelled "referencia" with its Sio Granos source; the 5 extra days, and all Quequén values, labelled "demo"; the partial-load-then-sail-south mechanic.
- [ ] The old hardcoded cost is gone, and "por tren" no longer appears in this block.
- [ ] `npm run lint` and `npm run build` pass, and the CSV export still works.
