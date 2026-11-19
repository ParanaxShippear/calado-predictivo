# 04: Documentación y guion

**What to build:** every document that still says the river projection is simulated says what is now true: real INA readings, a statistical model with a measured error, and a simulated scenario only as a labelled fallback. The pitch lines for the forecast are written down next to the lector's.

**Blocked by:** 03: Gráfico de la proyección y fecha de la bajante.

**Status:** ready-for-agent

Spec: `.scratch/pronostico-ina/spec.md` (S15, S16; D5, D9)

**Files:** `README.md`, `docs/hackathon-submission.md`, `.scratch/ai-hackathon/issues/05-ensayo-y-plan-b.md`

Before editing, run `git status --short`. If one of these files has uncommitted changes that are not yours, stop and ask the owner to commit them first.

- [ ] `README.md` carries the edits listed below.
- [ ] `docs/hackathon-submission.md` carries the edits listed below.
- [ ] `.scratch/ai-hackathon/issues/05-ensayo-y-plan-b.md`: in "What to say about the AI", the bullet that starts with `The river:` is replaced by the text below. Nothing else in that file changes.

```text
- The river (amended 2026-11-16, see `.scratch/pronostico-ina/spec.md`): "Las alturas son lecturas reales del INA. La proyección es de un modelo estadístico, no de IA: en 2019-2026 erró en promedio 9 cm a 72 horas." When the chip says "Escenario simulado", say it is simulated.
```

## README edits

Second paragraph of the file, replace with:

```text
Es un prototipo de hackathon. Las alturas del río son lecturas reales del INA y su proyección es de un modelo estadístico; el AIS, los costos del top-off y el precio de la soja son simulados o valores por defecto, y la interfaz lo indica (ver "Datos reales y datos simulados").
```

"Problema", last sentence, replace `sin una proyección del impacto económico` with `sin una proyección del río ni de su impacto económico`.

"Alcance", in "Incluido en la demo", replace the line added in ticket 01 (the one that ends with `en construcción: ver .scratch/pronostico-ina/).`) with:

```text
- Alturas reales del INA y una proyección estadística del río, con su error medido.
```

and replace the line `- Una etiqueta de "escenario crítico".` with `- Una etiqueta que dice si el río en pantalla son datos reales o un escenario simulado.`

The paragraph that starts with `El flujo principal es:` becomes:

```text
El flujo principal es: ingresar el IMO, hoy, la bajante de julio de 2021 (botón de fecha), gráfico, lucro cesante, comparación de puertos, orden de desvío, descargar el anexo en CSV. La interfaz no muestra datos ni cifras hasta que se ingresa un IMO; la demo usa `9436000` (Panamax).
```

"IMO de prueba": the last column is renamed "Pérdida a 72 hs (21/07/2021, datos reales)" with `9436000` 9.800 tn, lucro cesante de USD 3.920.000; `9321483` 700 tn, lucro cesante de USD 280.000; `9512277` 17.400 tn, lucro cesante de USD 6.960.000. The bullet about "No desviar" becomes: `- Para ver el caso en que "No desviar" es la mejor opción, elegir la fecha 2026-11-10: el río está por encima de los 2,47 m y no hay pérdida.`

"Ejecución", add after the paragraph about `ANTHROPIC_API_KEY`:

```text
Las alturas del río salen de `api/_ina_historico.py`. Para actualizarlo: `python .scratch/pronostico-ina/ina.py historico`. La aplicación no consulta al INA mientras corre: si el archivo tiene más de dos días, la fecha de hoy muestra el escenario simulado, y la interfaz lo indica. Conviene actualizarlo la noche anterior a una demo.
```

"Verificación", add the line `python .scratch/pronostico-ina/probar_pronostico.py` to the code block.

"Estado actual", add: `La especificación, los tickets y el ensayo de los datos del INA y la proyección están en `.scratch/pronostico-ina/`.`

## docs/hackathon-submission.md edits

In the answer to "¿Qué función cumple la AI en tu proyecto y cómo agrega valor?", replace the last sentence (`En esta demo los documentos son de ejemplo y la proyección del río es simulada.`) with:

```text
En esta demo los documentos son de ejemplo. La proyección del río no es IA: es un modelo estadístico ajustado con lecturas reales del INA.
```

In "Decisions", in the bullet that starts with `**AI answer says exactly what the AI does.**`, replace the sentence `The river projection is still simulated and the sample documents are fictional.` with `The sample documents are fictional. The river heights are real INA readings and their projection is a statistical model (a linear regression), described as that and never as AI.`

Add this bullet to "Decisions":

```text
- **The forecast claim is the measured one.** On 2019-2026, which the fit never saw, the model's mean error at 72 h was 9.1 cm against 13.7 cm for assuming no change, and its range held about 8 of 10 readings. In a stable deep bajante the projection is nearly flat. The draft formula rests on the 2.47 m reference BCR cites and on two press reports of April 2020. Details and sources: `.scratch/pronostico-ina/spec.md` D2 and D5.
```

In "Guardrails for the recording", replace the bullet that starts with `Say what the AI does in one sentence` with:

```text
- Say what the AI does in one sentence: "la IA lee la cotización y propone los costos; la cuenta es fija". Say what the forecast is in another: "las alturas son lecturas reales del INA y la proyección es de un modelo estadístico que en 2019-2026 erró 9 cm en promedio a 72 horas".
- Keep "datos simulados" for what is simulated: the AIS, the top-off costs and the soy price. When the chip says "Escenario simulado", say so.
```

## Verification

Read the three files once after editing and confirm that no sentence calls the forecast AI, calls a simulated scenario real, or states an error figure other than those of spec D5.

```bash
git grep -n "proyección del río sigue simulada\|river projection is simulated\|river projection is still simulated\|proyección del río es simulada" -- README.md AGENTS.md docs .scratch/ai-hackathon/issues/05-ensayo-y-plan-b.md
```

Expected: no match.

```bash
cd client && npm run lint && npm run build
```
