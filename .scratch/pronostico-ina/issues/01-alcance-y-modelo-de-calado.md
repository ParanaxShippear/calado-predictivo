# 01: Alcance y modelo de calado

**What to build:** the scope change the owner asked for, written into `AGENTS.md` and `README.md`, and the three constant changes that real river data needs before it arrives: the recalibrated safe draft, Quequén's `DEMO` extra days and the simulated scenario starting at 1,00 m. No real data yet: after this ticket the screen still shows the simulated scenario, with the new numbers.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

Spec: `.scratch/pronostico-ina/spec.md` (S1, S2, S3, S15, S18; D1, D2, D3, D4, D9)

**Files:** `AGENTS.md`, `README.md`, `api/main.py`, `client/src/App.jsx`, `.scratch/ai-hackathon/spec.md`

- [ ] `AGENTS.md` carries the edits listed under "AGENTS.md edits".
- [ ] `api/main.py`: `calado_maximo_pies` implements spec D2 with the constants `CALADO_CANAL_PIES`, `ALTURA_REFERENCIA_M` and `PIES_POR_METRO_BAJO_REFERENCIA`; `OFFSET_CANAL_M` and `UKC_M` are gone; `ALTURA_FALLBACK_M = 1.00` and stays marked `DEMO`. Nothing else in the file changes.
- [ ] `client/src/App.jsx`: Quequén's `diasExtra` is 5 in `PUERTOS_TOP_OFF`, and the comment above the constant no longer implies Quequén has fewer days.
- [ ] `README.md` carries the edits listed under "README edits".
- [ ] `.scratch/ai-hackathon/spec.md`: the on-screen table of D9 (the one that starts "On screen, with IMO `9436000` on today's date") is replaced by the on-screen table of this spec's D9, under the line `Amended 2026-11-16: the draft model and Quequén's DEMO days changed (.scratch/pronostico-ina/spec.md); these values replace the 13.300 tn ones.` The rest of that file is untouched.

## AGENTS.md edits

In "Real vs demo data", replace the bullet that starts with `Model assumptions:` with:

```text
- Model assumptions: 2,200 tn per foot of draft, 45,000 tn base load (model assumption, not verified: BCR cites Panamax of 60,000-65,000 tn), 34 ft Panamax design draft needed for the full load (`calado_diseno_pies`; model assumption, not verified; unrelated to Buenos Aires' 34 ft). Safe draft = 34 ft (`CALADO_CANAL_PIES`) when the Rosario gauge reads 2.47 m or more (`ALTURA_REFERENCIA_M`, the level BCR cites for the 34 ft guarantee), minus 1.7 ft per metre below it (`PIES_POR_METRO_BAJO_REFERENCIA`, fitted to two press reports of April 2020; model assumption). Sources and fit: `.scratch/pronostico-ina/spec.md` D2. Changing one means updating it here (single source).
```

In "Hackathon constraints", replace the bullet that starts with `Scope is closed` with:

```text
- Scope is closed. IN: the existing dashboard, a "datos simulados" badge, an AIS indicator that never shows green, a top-off port comparison (Bahía Blanca, Quequén) with demo costs, a "no desviar" row, rehearsal. UI improvements approved by the owner on 2026-10-24 (accessibility, es-AR number formats, decision hierarchy, an on-screen order document addressed to the agencia marítima; see `.scratch/ui-improvements/spec.md`). Added by the owner on 2026-11-13 for the Aleph Hackathon Rosario: ML/LLM, starting with the lector de cotizaciones (`.scratch/ai-hackathon/spec.md`), and the `anthropic` Python SDK. Added by the owner on 2026-11-16: real river heights from the INA public JSON API, a statistical river forecast and the generated data module `api/_ina_historico.py` (`.scratch/pronostico-ina/spec.md`). OUT: HTML scraping of real sources (the BCR price stays a placeholder), live AIS, agencia view, tests, README roadmap, any other new dependency. If a request is not IN, say no.
```

In the same section, replace the bullet that starts with `Primary persona:` with:

```text
- Primary persona: the agroexportadora. Golden path: enter IMO -> today -> the bajante of July 2021 (date button) -> chart -> lucro cesante -> top-off port comparison -> order of diversion -> download the CSV annex. Must work on every commit.
```

Until ticket 03 adds the date button, the golden path uses the calendar to reach that date.

## README edits

In "Supuestos del modelo", replace the bullet that starts with `Calado máximo seguro =` with:

```text
- Calado máximo seguro = 34 pies cuando el hidrómetro de Rosario marca 2,47 m o más, y 1,7 pies menos por cada metro por debajo. Los 2,47 m son el nivel que cita la BCR para la garantía de 34 pies; los 1,7 pies por metro son un supuesto ajustado con dos reportes de prensa de abril de 2020 (31 pies con cerca de 1 m, y 31'06" con 0,78 m).
```

In the same list, the bullet about the 34 ft design draft ends at `ni con los 34 pies de Buenos Aires.`; remove the rest of that sentence, since the channel's 34 ft is now part of the model.

In "Alcance", replace the sentence that starts with `Fuera de alcance:` with:

```text
Fuera de alcance: scraping de páginas (el precio de la BCR sigue con su valor por defecto), un asistente de chat, AIS en vivo, vista para la agencia marítima y tests.
```

and add to "Incluido en la demo": `- Alturas reales del INA y una proyección estadística del río (en construcción: ver .scratch/pronostico-ina/).`

In "IMO de prueba", the column "Pérdida a 72 hs (escenario actual)" is renamed "Pérdida a 72 hs (escenario simulado)" with these values: `9436000` 6.900 tn, lucro cesante de USD 2.760.000; `9321483` 0 tn; `9512277` 13.800 tn, lucro cesante de USD 5.520.000. Replace the bullet that starts with `Para ver el caso en que todos los puertos` with: `- Con el Handymax `9321483` el escenario simulado no tiene pérdida, y "No desviar" es la mejor opción.`

## Verification

```bash
cd api && uvicorn main:app --port 8000
```

```bash
python -c "import json,urllib.request as u; d=json.load(u.urlopen('http://127.0.0.1:8000/api/pronostico-calado?imo=9436000')); v=[p for p in d['serie'] if p['fecha']>d['fecha_analisis']]; print(d['altura_actual_m'], [(p['altura_rio_m'], p['calado_maximo_seguro_pies'], p['tonelaje_no_cargado_tn']) for p in v], d['resumen'])"
```

Expected: `1.0 [(0.94, 31.4, 5700), (0.77, 31.11, 6400), (0.63, 30.87, 6900)]` and a `resumen` with `perdida_capacidad_tn: 6900` and `lucro_cesante_72hs_usd: 2760000`.

The same command with `imo=9321483` gives 0 tn not loaded on the three days, and with `imo=9512277` gives `(0.94, 31.4, 12400), (0.77, 31.11, 13100), (0.63, 30.87, 13800)` with a `lucro_cesante_72hs_usd` of 5520000.

```bash
python .scratch/ai-hackathon/probar_lector.py http://127.0.0.1:8000/api
```

Expected: three `OK` lines (the lector does not depend on the river model).

```bash
cd client && npm run lint && npm run build
```

UI with IMO `9436000` on today's date: the "Simulated" rows of the on-screen table in spec D9. Bahía Blanca is the best option (USD 434.600, +USD 2.325.400); applying the sample "Cotización de agencia: Quequén" moves it to Quequén (USD 347.700, +USD 2.412.300). Golden path through the CSV download.
