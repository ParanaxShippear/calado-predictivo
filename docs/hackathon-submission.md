# Hackathon submission: source of truth

Answers entered in the "Proyecto" form (as of 2026-10-24) plus the decisions behind them and the video plan. If the form and this file differ, update this file first.

> Aleph Hackathon Rosario (2026-11-28): the tracks were not announced as of 2026-11-15. The "Track" answer and the AI answer below must be rewritten once they are. The other form answers are from the previous event (2026-10-24, track "Finanzas").

## Form answers (verbatim, Spanish)

**Nombre del equipo:** ParanaLove

**Track:** Finanzas

**¿Qué problema resuelven?**
Cuando el Paraná baja, los buques salen de Rosario a medio llenar: el exportador pierde millones o debe completar la carga en un puerto de mar. Para decidir tiene que cruzar a mano la altura del río, el calado, las toneladas que no entran, los USD perdidos y el costo de cada alternativa, todo en herramientas separadas. Nosotros unificamos esos cálculos en una única interfaz.

**¿Qué están construyendo?**
Un panel que proyecta la altura del río a 72 hs, calcula el calado seguro y traduce la bajante en toneladas no cargadas y USD de lucro cesante. Además compara en qué puerto conviene completar la carga (Bahía Blanca, Quequén o si conviene no desviar directamente).

**¿Quién lo usaría primero?**
Equipos de logística y comercialización de agroexportadoras del Gran Rosario, arrancando por agroexportadoras medianas y traders.

**¿Qué tan grande es el mercado?**
Cerca del 75% de las exportaciones argentinas de granos, harinas y aceites sale por unas 20 terminales del Gran Rosario (75,7 M de tn en 2025, según la BCR). La bajante de 2021 costó más de USD 620 M al sector.

**¿Por qué ahora?**
Las bajantes extremas del Paraná siempre fueron recurrentes y además se ha comprobado que en los últimos años el nivel del río se ha vuelto más variable e impredecible debido a fenómenos climáticos. A pesar de todo esto la decisión sigue siendo manual. Los datos públicos (INA, BCR) y los modelos de proyección ya son accesibles para automatizar esa decisión.

**¿Qué función cumple la AI en tu proyecto y cómo agrega valor?**
La IA (Claude, de Anthropic) lee las cotizaciones de top-off que hoy llegan por mail, de la agencia marítima o del broker, y propone los costos de cada puerto mostrando la frase de la que sacó cada número. El usuario los confirma y la comparación se recalcula. La cuenta es una fórmula fija: la IA no decide ni proyecta. En esta demo los documentos son de ejemplo. La proyección del río no es IA: es un modelo estadístico ajustado con lecturas reales del INA.

## Decisions

- **Product name: Paranax** (team name: ParanaLove). Set by the owner on 2026-10-24; the form answers above do not name the product.
- **Date arbitrage is no longer in the product.** The owner removed the "Arbitraje Logístico" block on 2026-10-24. The form answer "recomienda fecha de zarpe y puerto de top-off" (AI question) no longer matches: the product recommends the top-off port and shows the order. Update the form or that sentence before submitting.
- **Track: Finanzas.** The repo frames the product as an agro-fintech command center (lucro cesante in USD, top-off cost comparison).
- **AI answer says exactly what the AI does.** Claude reads a pasted cotización and proposes five cost inputs with the sentence behind each; the user confirms them; cost and ahorro neto are a fixed formula. The sample documents are fictional. The river heights are real INA readings and their projection is a statistical model (a linear regression), described as that and never as AI. `AGENTS.md` requires the UI and the pitch to say what is AI-driven, what is a deterministic model and what is simulated data.
- **The forecast claim is the measured one.** On 2019-2026, which the fit never saw, the model's mean error at 72 h was 9.1 cm against 13.7 cm for assuming no change, and its range held about 8 of 10 readings. In a stable deep bajante the projection is nearly flat. The draft formula rests on the 2.47 m reference BCR cites and on two press reports of April 2020. Details and sources: `.scratch/pronostico-ina/spec.md` D2 and D5.
- **That costs arrive as an email or a recap is the team's reading of the business**, not verified with an exporter. Say "documento de ejemplo" in the pitch.
- **Market size uses only sourced figures.** The number of exporting companies was not found in any source, so it is not claimed. Figures are cited with their source below.
- **"Por qué ahora" climate claim.** The sentence "el nivel del río se ha vuelto más variable e impredecible debido a fenómenos climáticos" is the team's wording and has no source in this repo. Add one before defending it in front of the jury.

## Sources for the figures

| Claim | Source |
|---|---|
| ~75% of Argentine grain, meal and oil exports leave through Gran Rosario | [Infobae, citing BCR](https://www.infobae.com/economia/2026/06/02/ranking-mundial-la-argentina-fue-el-tercer-exportador-agricola-y-rosario-domino-el-comercio-global-de-granos-en-2025/); [iProfesional](https://www.iprofesional.com/comex/455992-gran-rosario-recupero-liderazgo-agroexportador-supero-estados-unidos-brasil). An older BCR analysis gave 77–80%, so the figures are not strictly comparable. |
| 75,7 M tn shipped in 2025, first agro-export node in the world | [La Capital](https://www.lacapital.com.ar/economia/el-gran-rosario-volvio-ser-el-principal-nodo-agroexportador-del-mundo-n10262055.html) |
| ~20 terminals | BCR report of May 2026: 30 port terminals over 70 km, 18 dispatch agro products. Another source (River Plate Shipping Guide, 2024 data) counts 34 and 22. Hence "unas 20". |
| 2021 bajante cost more than USD 620 M | [Bloomberg Línea, citing BCR](https://www.bloomberglinea.com/2021/09/25/bajante-del-parana-argentina-ya-perdio-us-620m-y-los-pronosticos-no-mejoran/) |
| 2022: almost USD 280 M in five months, USD 138 M of it falso flete | [BAE Negocios, citing BCR](https://www.baenegocios.com/economia/Por-la-bajante-del-Parana-se-perdieron-280-millones-de-dolares-en-cinco-meses-20220513-0109.html) |

These were taken from search result summaries, not from the full reports. Open the links before quoting them in the video.

## YouTube video plan (~2 min)

| Time | Content |
|---|---|
| 0:00–0:15 | Opening clip: the problem only (2,200 tn per foot of draft, USD 620 M in 2021). Generated with `/brag` and a free-form direction, `--duration 15`. |
| 0:15–1:45 | MVP on screen: solution, who it is for, then the golden path: enter IMO 9436000, today, chart, lucro cesante, top-off comparison, export CSV. |
| 1:45–2:00 | Closing clip generated with `/brag`, `--duration 15`, tone `polished` or `app-store`. |

Decisions:

- Opening via `/brag` (option A), not a custom Hyperframes composition. `/brag` requires one scene with the real UI, so the opening may end with a short UI glimpse. If it feels too product-centric and dilutes the problem, fall back to building it directly with Hyperframes.
- Both clips are generated only after the UI is declared finished, because `/brag` recreates the UI from `App.jsx` and goes stale if the UI changes.
- The two clips take ~30 s of the 120 s, leaving ~90 s for the MVP.

Guardrails for the recording:

- Say "datos simulados" out loud during the demo. The badge is already in the UI.
- Say what the AI does in one sentence: "la IA lee la cotización y propone los costos; la cuenta es fija". Say what the forecast is in another: "las alturas son lecturas reales del INA y la proyección es de un modelo estadístico que en 2019-2026 erró 9 cm en promedio a 72 horas".
- Keep "datos simulados" for what is simulated: the AIS, the top-off costs and the soy price. When the chip says "Escenario simulado", say so.
- If the label on screen says "Lectura precargada", say so out loud.
- Record with the backend already running, to avoid the scraping timeout on camera.

The `brag` skill is installed in `.agents/skills/brag`. It runs `npx hyperframes ...`, which downloads and executes a third-party package. Its `SKILL.md`, references and script were reviewed on 2026-10-24; the Hyperframes package itself was not.

## How to explain the order of diversion in the pitch

What the product shows: pressing "Emitir Orden de Desvío" generates the document the exporter would send to the shipping agency: the vessel, the partial load to leave Rosario with, how much to complete and at which port, the reason (the projected safe draft) and the estimated cost and saving. In the demo it is shown on screen only; nothing is sent or stored, and the document says it was generated with simulated data.

How to say it: "la orden queda lista para la agencia marítima" or "así sería la orden que recibe la agencia". Do not say it was sent.

Caveat: that the agency is the recipient and what the real instruction looks like is the team's reading of the business, not verified with an exporter (the research notes list how exporters decide and with which tools as an evidence gap). Validate it in an interview before presenting it as how the industry works.
