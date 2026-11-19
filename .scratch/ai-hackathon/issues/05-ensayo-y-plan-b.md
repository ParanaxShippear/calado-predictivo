# 05: Ensayo del demo y plan B

**What to build:** a rehearsed demo with every check observed and written down, a measured latency for the AI reading, the deploy on Vercel working with its key, and a plan B the presenter can run without thinking when the AI call fails on stage.

**Blocked by:** 04: Origen de los costos en la orden y documentación.

**Status:** ready-for-human

Spec: `.scratch/ai-hackathon/spec.md` (S15, S19, S20; D9, D12)

The steps marked (human) need the owner: the key, the Claude Console, Vercel and the stage. An agent can run the rest and record the results. Write every observed result under `## Resultados observados` in this file; report a failure instead of hiding it.

## Setup (human)

- [ ] Create a dedicated API key in its own workspace in the Claude Console and set a monthly spend limit on that workspace (USD 10 covers about a thousand readings at the estimated cost). The owner will define the amount later (2026-11-15); set it before the endpoint is deployed with a key.
- [ ] Set `ANTHROPIC_API_KEY` in the shell that runs uvicorn. PowerShell: `$env:ANTHROPIC_API_KEY = "..."`. bash: `export ANTHROPIC_API_KEY=...`.
- [ ] On Vercel, add `ANTHROPIC_API_KEY` as a project environment variable for Production and Preview, check that Fluid compute is enabled in the project settings, and redeploy.
- [x] Confirm with the organizers that a pre-built repo is allowed (confirmed by the owner, 2026-11-15).
- [ ] Rewrite the "Track" and AI answers of `docs/hackathon-submission.md` once the tracks are announced.

## Rehearsal checks

- [ ] `cd client && npm run lint && npm run build` pass.
- [ ] No key: `python .scratch/ai-hackathon/probar_lector.py` prints three `OK` lines with `origen=precargado` and `motivo=sin_clave`.
- [ ] With the key: `python .scratch/ai-hackathon/probar_lector.py http://localhost:8000/api 5` prints fifteen `OK` lines with `origen=ia`. Record `mediana` and `max`. Bar: median at most 4 s and max at most 8 s. Over the bar, report to the owner with the numbers; the options are Claude Haiku 5.5 (the constant `MODELO_IA`, then rerun this check) or keeping the model and narrating the wait.
- [ ] (human) Vercel: `python .scratch/ai-hackathon/probar_lector.py https://<deploy-url>/api 3` prints `origen=ia`. Record `mediana` and `max`; the first call includes the cold start.
- [ ] UI with the key, IMO `9436000`: the three rows of the on-screen table in spec D9 match, the label reads "Leído por IA (modelo claude-sonnet-5-5)…", and the order footer names the AI reading.
- [ ] The sample "Documento que no es una cotización" shows "La IA no encontró costos de top-off en este documento."
- [ ] A document that is not a sample: write a short quote on the spot with other numbers (for example 6 días and USD 41 for Bahía Blanca), read it, and confirm the values and their citas. This is the proof that the reading is not canned.
- [ ] (human) Network off, local API with the key: read a sample. Record the seconds until the label "Lectura precargada…" appears; it must be about 10 s or less.
- [ ] No key: the same sample answers at once with the stored reading and the same numbers.
- [ ] `git grep -n "sk-ant" -- .` finds nothing and `git status --short` shows no `.env`.
- [ ] (human) The CSV download saves the file in a browser with a window (still pending from the previous rehearsal).
- [ ] (human) Record a 60 to 90 s screen video of the whole flow with the AI reading live. Keep it on the presenter's laptop.
- [ ] (human) Warm-up: make one real reading in the 24 hours before the pitch and one a few minutes before going on stage. The first call with a schema compiles its grammar and is slower; the compiled grammar stays cached for 24 hours from its last use.

## Plan B on stage

The demo runs locally (API and client on the presenter's laptop). The Vercel URL is open in a second tab as a spare.

| Situation | Presenter does | Presenter says |
|---|---|---|
| The venue network is unreliable before going on stage | Start uvicorn in a shell without `ANTHROPIC_API_KEY`: the stored reading answers at once | "Acá no tenemos red, así que esta lectura es la precargada: la etiqueta lo dice. Con conexión la hace Claude en vivo." |
| "Leyendo…" lasts more than 5 s | Keep talking about the cita and the confirmation step; the backend answers with the stored reading by 10 s | The same line, when the label appears |
| The label says "Lectura precargada" unexpectedly | Carry on: the numbers are the same | Read the label out loud |
| The AI returns a value different from the rehearsal | Show the cita, fix the field by hand, apply | "Por esto el usuario confirma cada valor antes de aplicarlo." |
| The local API or the laptop fails | Switch to the Vercel tab; if that fails too, play the recorded video | "Les muestro la grabación del ensayo de ayer." |

After the event (human): remove the key from Vercel and revoke it in the Console.

## What to say about the AI

- One sentence: "La IA lee la cotización y propone los costos, mostrando de qué frase sacó cada número. El usuario confirma y la cuenta es una fórmula fija."
- The documents: "Son documentos de ejemplo."
- The river (amended 2026-11-16, see `.scratch/pronostico-ina/spec.md`): "Las alturas son lecturas reales del INA. La proyección es de un modelo estadístico, no de IA: en 2019-2026 erró en promedio 9 cm a 72 horas." When the chip says "Escenario simulado", say it is simulated.
- "¿La IA decide a qué puerto ir?" -> "No. Lee el documento. La comparación es una cuenta que cualquiera puede revisar."
- "¿Y si se equivoca?" -> "Cada número viene con su cita, verificamos que la cita esté en el documento, descartamos valores fuera de rango y el usuario confirma antes de aplicar."
- "¿Qué modelo usan?" -> "Claude Sonnet 5.5, por la API de Anthropic. La etiqueta en pantalla muestra el modelo que respondió."

## Resultados observados

Observed on 2026-11-16 by the agent, on the owner's laptop: local API with the key set by the owner, client on Vite, commit `b16c152`. The (human) steps and the Vercel check were not run.

- `cd client && npm run lint && npm run build`: both pass. Lint prints one warning (`react(set-state-in-effect)`, `src/App.jsx:666`); the build prints the chunk-size warning.
- No key (second API on port 8001, started in a shell without the variable): three `OK` lines, `origen=precargado`, `motivo=sin_clave`, `llamadas=3 mediana=0.0s max=0.0s fallas=0`.
- With the key, `python .scratch/ai-hackathon/probar_lector.py http://localhost:8000/api 5`: fifteen `OK` lines, `origen=ia`, `modelo=claude-sonnet-5-5`, `citas_sin_verificar=0`. Last line: `llamadas=15 mediana=5.3s max=6.4s fallas=0`.
- **Finding, latency bar.** Expected: median at most 4 s and max at most 8 s. Obtained: median 5.3 s (over the bar), max 6.4 s (within it). About 2.1 s of each call is not the API: on this machine `urllib` takes 2.09 s to reach `localhost` and 0.00 s to reach `127.0.0.1` (measured on `GET /api/cotizaciones-ejemplo`). One round against `http://127.0.0.1:8000/api` gave `llamadas=3 mediana=3.4s max=3.5s fallas=0`. In the browser, from "Leer con IA" to the proposal on screen: 3.7 s (recap), 3.3 s (agencia), 2.7 s (no cotización). Three samples each way are too few to call the bar met; the decision between Claude Haiku 5.5 and narrating the wait stays with the owner.
- UI with the key, IMO `9436000`:
  - No cotización applied: Bahía Blanca -USD 652.200 / +USD 4.667.800 ("Mejor opción"); Quequén -USD 665.400 / +USD 4.654.600; No desviar USD 0 / +USD 0.
  - "Cotización de agencia: Quequén" applied: Bahía Blanca -USD 652.200 / +USD 4.667.800; Quequén -USD 558.900 / +USD 4.761.100 ("Mejor opción", "Según cotización").
  - "Recap del broker" applied: Bahía Blanca -USD 691.300 / +USD 4.628.700; Quequén -USD 675.400 / +USD 4.644.600 ("Mejor opción"); both rows "Según cotización".
  - All match spec D9. The label read "Leído por IA (modelo claude-sonnet-5-5). Revisá cada valor antes de aplicarlo." and the order footer added "Costos del top-off tomados de una cotización leída por IA y confirmada por el usuario."
- "Documento que no es una cotización": showed "La IA no encontró costos de top-off en este documento."
- A document that is not a sample, written on the spot (6 días and USD 41 for Bahía Blanca, costo diario USD 19.500): the reading returned 19500, 6 and 41, each with its cita from the text, and left Quequén empty. Label "Leído por IA".
- No key, UI (client pointed at the keyless API): the sample "Cotización de agencia: Quequén" answered with "Lectura precargada: en este intento no se usó IA (no hay clave de API configurada)." and the same numbers (Quequén -USD 558.900 / +USD 4.761.100). The order footer read "Costos del top-off cargados por el usuario a partir de una cotización."
- Order footer, other cases: with the DEMO costs only "Documento generado por Paranax con datos simulados."; after editing Quequén's días to 4 on a reading from Claude, the "cargados por el usuario" line; after "Volver a los costos demo", the first case again.
- Golden path: order issued and "Descargar (CSV)" pressed; the button changed to "Archivo descargado ✓" and the generated CSV had the header plus three rows with buque and IMO. The file on disk was not observed (still a (human) step).
- `git grep -n "sk-ant" -- .`: the only matches are the two ticket lines that quote this command. `git status --short` shows no `.env`.
- Not run: the Vercel check, network off with the key, the CSV saved to disk, the screen recording, the warm-up, and the timeout path of ticket 03 with the real client (see that ticket).
- The UI was driven with scripted clicks in a hidden browser pane, not looked at: layout and visual states were not checked in this rehearsal.
