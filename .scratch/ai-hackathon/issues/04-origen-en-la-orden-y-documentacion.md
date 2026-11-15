# 04: Origen de los costos en la orden y documentación

**What to build:** the order of diversion says where its costs came from when a cotización is applied, and the three documents describe the product as it now is: what the AI does, what stays a fixed formula and what is simulated.

**Blocked by:** 02: Panel del lector en el Simulador Top-off, 03: Lectura con Claude.

**Status:** ready-for-agent

Spec: `.scratch/ai-hackathon/spec.md` (S16, S17, S18; D11)

**Files:** `client/src/App.jsx`, `README.md`, `docs/hackathon-submission.md`

Before editing `docs/hackathon-submission.md`, run `git status --short`. If the file shows uncommitted changes that are not yours, stop and ask the owner to commit them first: they are the owner's edits to the video plan.

- [ ] `OrdenDesvio` receives `costosCotizacion.origen` (spec D10). With origin `'ia'` the footer adds "Costos del top-off tomados de una cotización leída por IA y confirmada por el usuario." With origin `'usuario'` it adds "Costos del top-off cargados por el usuario a partir de una cotización." With the `DEMO` costs the footer is unchanged. The existing line "Documento generado por Paranax con datos simulados." stays in all three cases.
- [ ] The origin follows spec D10: a value edited after a reading from Claude, a stored reading and a manual entry all count as `'usuario'`.
- [ ] `README.md`, "Datos reales y datos simulados": the table gains the two rows below, and the "Costos del top-off" row adds that a cotización confirmed by the user replaces them on screen.

  | Dato | Origen | Estado |
  |---|---|---|
  | Lectura de cotizaciones | IA (Claude, API de Anthropic). Sin clave, sin red o si la llamada tarda más de 10 s, se usa una lectura precargada o la carga manual. | Real cuando la etiqueta dice "Leído por IA". La IA solo lee el documento y propone valores; el costo y el ahorro neto se calculan con una fórmula fija. |
  | Documentos de ejemplo del lector | Constantes en `api/main.py` | Demo. Son ficticios y la interfaz lo indica. |

- [ ] `README.md`, "Alcance": "Incluido en la demo" gains "Un lector de cotizaciones con IA para los costos del top-off." and the "Fuera de alcance" sentence becomes: "Fuera de alcance: scraping real, modelos de pronóstico (la proyección del río sigue simulada), un asistente de chat, AIS en vivo, vista para la agencia marítima y tests."
- [ ] `README.md`, "Estado actual" points to `.scratch/ai-hackathon/` for the lector's spec, tickets and rehearsal.
- [ ] `docs/hackathon-submission.md` carries the edits listed below.

## docs/hackathon-submission.md edits

Add this note right under the first paragraph of the file:

```text
> Aleph Hackathon Rosario (2026-11-28): the tracks were not announced as of 2026-11-15. The "Track" answer and the AI answer below must be rewritten once they are. The other form answers are from the previous event (2026-10-24, track "Finanzas").
```

Replace the answer to "¿Qué función cumple la AI en tu proyecto y cómo agrega valor?" with:

```text
La IA (Claude, de Anthropic) lee las cotizaciones de top-off que hoy llegan por mail, de la agencia marítima o del broker, y propone los costos de cada puerto mostrando la frase de la que sacó cada número. El usuario los confirma y la comparación se recalcula. La cuenta es una fórmula fija: la IA no decide ni proyecta. En esta demo los documentos son de ejemplo y la proyección del río es simulada.
```

In "Decisions", replace the bullet that starts with `**AI answer is deliberately honest.**` with:

```text
- **AI answer says exactly what the AI does.** Claude reads a pasted cotización and proposes five cost inputs with the sentence behind each; the user confirms them; cost and ahorro neto are a fixed formula. The river projection is still simulated and the sample documents are fictional. `AGENTS.md` requires the UI and the pitch to say what is AI-driven, what is a deterministic model and what is simulated data.
- **That costs arrive as an email or a recap is the team's reading of the business**, not verified with an exporter. Say "documento de ejemplo" in the pitch.
```

In "Guardrails for the recording", replace the bullet that starts with `Do not say "AI en vivo"` with:

```text
- Say what the AI does in one sentence: "la IA lee la cotización y propone los costos; la cuenta es fija". The river projection is simulated: describe it as simulated, never as an AI or machine-learning forecast.
- If the label on screen says "Lectura precargada", say so out loud.
```

## Verification

```bash
cd client && npm run lint && npm run build
```

UI, with the API running:

1. IMO `9436000`, no cotización applied: the order footer shows only "Documento generado por Paranax con datos simulados."
2. With the key set, read and apply "Cotización de agencia: Quequén" without editing: the footer adds "Costos del top-off tomados de una cotización leída por IA y confirmada por el usuario."
3. Read it again, change Quequén's días to 4 and apply: the footer adds "Costos del top-off cargados por el usuario a partir de una cotización."
4. Without the key (restart uvicorn in a shell without the variable), read and apply the same sample: the footer shows the "cargados por el usuario" line.
5. "Volver a los costos demo": the footer is back to step 1.
6. Golden path through the CSV download still works.

Docs: read the three files once after editing and confirm no sentence claims a live INA/BCR source, a forecast model or an AI decision.
