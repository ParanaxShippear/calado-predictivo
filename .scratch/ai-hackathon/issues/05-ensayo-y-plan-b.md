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
- The river: "La proyección del río es simulada." Describe it as simulated every time it comes up.
- "¿La IA decide a qué puerto ir?" -> "No. Lee el documento. La comparación es una cuenta que cualquiera puede revisar."
- "¿Y si se equivoca?" -> "Cada número viene con su cita, verificamos que la cita esté en el documento, descartamos valores fuera de rango y el usuario confirma antes de aplicar."
- "¿Qué modelo usan?" -> "Claude Sonnet 5.5, por la API de Anthropic. La etiqueta en pantalla muestra el modelo que respondió."

## Resultados observados

(pending)
