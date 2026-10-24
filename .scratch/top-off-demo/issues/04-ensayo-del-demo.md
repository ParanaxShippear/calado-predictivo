# 04: Ensayo del demo

**What to build:** a full rehearsal of the golden path (hoy -> gráfico -> lucro cesante -> comparación de top-off -> orden -> CSV) with every check observed and written down, so the demo has no surprises. The pitch script, numbers and Q&A are prepared by the presentation team, not by this ticket.

**Blocked by:** 01: Etiquetado demo, 03: Selección conectada a la orden, KPI y limpieza de "por tren".

**Status:** ready-for-agent

Spec: `.scratch/top-off-demo/spec.md`

- [x] `cd client && npm run lint && npm run build` pass.
- [x] With the API running, `curl localhost:8000/api/pronostico-calado` returns the unchanged contract.
- [x] Searching `App.jsx` for "tren" finds nothing in user-visible text.
- [x] The "datos de demo" badge is visible on load.
- [x] The AIS indicator is never green, before and after linking `9436000`.
- [x] The order confirmation names the selected port for both Bahía Blanca and Quequén, never a fixed one.
- [x] The "no desviar" row appears and can be selected; with it selected the button reads "Registrar decisión: no desviar" and pressing it shows the decision as recorded. A date where every port is negative marks "no desviar" as best (con el Panamax por defecto no existe, porque su pérdida nunca llega a cero; usar el Handymax IMO `9321483` el 2026-10-04).
- [x] The "escenario crítico" label and the assumptions text under the table are visible.
- [ ] The golden path works end to end, including the CSV download.
- [x] The observed result of each check is recorded in this file, and any failure is reported rather than hidden.

## Resultados observados (ensayo del 2026-10-24)

Comandos y navegador: Edge headless controlado con puppeteer-core contra `http://localhost:5173` (cliente) y `http://localhost:8000` (API), sin modificar el proyecto.

1. `npm run lint`: 0 errores y 1 advertencia ya existente (`react(set-state-in-effect)` en `App.jsx`, el `useEffect` de carga). `npm run build`: `built in 1.13s`, con el aviso habitual de tamaño de chunk.
2. `curl localhost:8000/api/pronostico-calado`: las claves son `altura_actual_m, buque, carga_base_tn, es_hoy, es_pasado, fecha_analisis, fuentes, precio_soja_usd_tn, resumen, serie, ubicacion`, las mismas de antes. `api/` no tiene cambios en estos commits.
3. Búsqueda de "tren" y "logística terrestre" en `App.jsx`: sin coincidencias. En el texto renderizado de la pantalla tampoco aparecen.
4. Badge "datos de demo": visible al cargar.
5. AIS: `🟡 AIS (Buque)` antes de vincular y `🟡 AIS (Buque)` después de vincular `9436000`. No hay `🟢` en la pantalla en ninguno de los dos casos.
6. Orden con Bahía Blanca elegido: "Orden #482 emitida: el buque se desvía al sur para completar la carga en Bahía Blanca." Con Quequén elegido: "...en Quequén." El KPI "Ahorro Logístico Asegurado" nombra el puerto elegido.
7. Con "No desviar" elegido, el botón dice "Registrar decisión: no desviar" y al apretarlo muestra "Decisión registrada: no desviar" y queda como "Decisión registrada". (Después del ensayo se reemplazó el botón deshabilitado por este registro en pantalla.) Al cambiar la fecha, la selección vuelve a la mejor opción y la orden emitida desaparece.
8. Escenario crítico: la etiqueta está en la sección del gráfico. Los supuestos bajo la tabla (2.200 tn por pie, Panamax de referencia de 45.000 tn, calado de diseño de 34 ft como supuesto, costos por puerto con su rótulo, mecánica de carga parcial y navegación al sur) son visibles.
9. Mejor opción con el escenario actual (Panamax por defecto): Bahía Blanca (USD 652.200 de costo y +USD 4.667.800 de ahorro neto), seguida de Quequén (USD 665.400 y +USD 4.654.600).
10. Fecha con todos los puertos negativos: con el Panamax por defecto no existe, porque en el pasado la altura simulada nunca supera unos 4,3 m y siempre hay pérdida. Se observó con el Handymax `9321483` el 2026-10-04: toneladas a completar 0, Bahía Blanca -USD 200.000, Quequén -USD 160.000, y "No desviar" queda marcado como elegido (mejor opción) con el botón en "Registrar decisión: no desviar" (en el ensayo original estaba deshabilitado).
11. CSV: el botón genera el archivo `reporte-calado-2026-10-24.csv` con las 3 filas de la ventana y el cambio de texto "Reporte generado ✓". El contenido se verificó interceptando el `Blob`. La descarga a disco no se pudo observar: Edge headless la canceló (`Browser.downloadProgress: canceled`) tanto con la API original como sin `revokeObjectURL`, así que queda por confirmar en un navegador con ventana.

Pendientes y observaciones que no son parte de estos tickets:

- La descarga del CSV hay que probarla a mano en un navegador con ventana (punto 11).
- Corregido después del ensayo: el KPI "Lucro Cesante (72hs)" mostraba `-$14,680,000 USD` porque sumaba tres días de pérdida del mismo buque. La API ahora devuelve el del peor día de la ventana, como el top-off: `-$5,320,000 USD` con el Panamax por defecto (commit `f256cdf`).
- Corregido después del ensayo: con pérdida cero el KPI mostraba `-$0 USD` y ahora muestra `$0 USD` (commit `a447553`).
