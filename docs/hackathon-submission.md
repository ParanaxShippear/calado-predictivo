# Hackathon submission: source of truth

Answers entered in the "Proyecto" form (as of 2026-10-24) plus the decisions behind them and the video plan. If the form and this file differ, update this file first.

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
Un modelo proyecta la altura del río a 72 hs y recomienda fecha de zarpe y puerto de top-off para minimizar el lucro cesante. En esta demo la proyección es simulada y las reglas del modelo son determinísticas. El siguiente paso es reemplazarla por un modelo entrenado con series históricas del INA. La razón de esta decisión es que estamos haciendo un MVP con tiempo limitado en una hackatón.

## Decisions

- **Product name: Paranax** (team name: ParanaLove). Set by the owner on 2026-10-24; the form answers above do not name the product.
- **Date arbitrage is no longer in the product.** The owner removed the "Arbitraje Logístico" block on 2026-10-24. The form answer "recomienda fecha de zarpe y puerto de top-off" (AI question) no longer matches: the product recommends the top-off port and shows the order. Update the form or that sentence before submitting.
- **Track: Finanzas.** The repo frames the product as an agro-fintech command center (lucro cesante in USD, top-off cost comparison).
- **AI answer is deliberately honest.** `AGENTS.md` puts ML/LLM out of scope and forbids claiming an AI model is live. The projection is simulated and the model rules are deterministic; the form says so.
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
| 0:00–0:45 | Business: problem, solution, who. Voice over simple images. |
| 0:45–1:45 | Real demo, screen recording of the golden path: enter IMO 9436000, today, chart, lucro cesante, top-off comparison, export CSV. |
| 1:45–2:00 | Closing clip generated with the `brag` skill (`/brag`, 15–25 s by design), tone `polished` or `app-store`. |

Guardrails for the recording:

- Say "datos simulados" out loud during the demo. The badge is already in the UI.
- Do not say "AI en vivo" or "predicción con machine learning". The projection is simulated.
- Record with the backend already running, to avoid the scraping timeout on camera.

The `brag` skill is installed in `.agents/skills/brag`. It runs `npx hyperframes ...`, which downloads and executes a third-party package. Its `SKILL.md`, references and script were reviewed on 2026-10-24; the Hyperframes package itself was not.

## How to explain the order of diversion in the pitch

What the product shows: pressing "Emitir Orden de Desvío" generates the document the exporter would send to the shipping agency: the vessel, the partial load to leave Rosario with, how much to complete and at which port, the reason (the projected safe draft) and the estimated cost and saving. In the demo it is shown on screen only; nothing is sent or stored, and the document says it was generated with simulated data.

How to say it: "la orden queda lista para la agencia marítima" or "así sería la orden que recibe la agencia". Do not say it was sent.

Caveat: that the agency is the recipient and what the real instruction looks like is the team's reading of the business, not verified with an exporter (the research notes list how exporters decide and with which tools as an evidence gap). Validate it in an interview before presenting it as how the industry works.
