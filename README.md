# Paranax

Panel de decisiones para agroexportadoras del Gran Rosario. Proyecta la altura del Río Paraná en Rosario, calcula el calado máximo seguro de un buque Panamax y traduce la bajante en toneladas no cargadas y lucro cesante en dólares. Compara además en qué puerto conviene completar la carga (top-off).

Es un prototipo de hackathon. Parte de los datos son simulados y la interfaz lo indica (ver "Datos reales y datos simulados").

## Problema

Cuando el Paraná baja, el calado máximo seguro de los buques se reduce y no pueden cargarse a su capacidad óptima. Con el modelo actual, un Panamax pierde unas 2.200 tn por cada pie de calado faltante sobre una carga base de 45.000 tn. Cada tonelada que no se embarca es lucro cesante. Hoy esa decisión se toma reaccionando a la altura del día, sin una proyección del impacto económico.

## Funcionalidad

- Pantalla inicial que pide el IMO del buque; hasta entonces no se muestra ningún dato.
- Altura del río en Rosario: 4 días de lecturas reales del INA y la proyección de un modelo estadístico, con su rango. Si el INA todavía no publicó la lectura de hoy, la altura de hoy es una estimación y la interfaz lo indica.
- Calado máximo seguro (en pies) y tonelaje recomendado para cada día.
- Pérdida de capacidad y lucro cesante a 72 hs. Como un buque se carga una sola vez, el lucro cesante es el del peor día de la ventana, no la suma de los tres.
- Comparación de puertos de top-off contra la opción de no desviar.
- Orden de desvío: documento dirigido a la agencia marítima, siempre visible como borrador y actualizado con la opción elegida. Se emite desde el propio documento. Muestra la cuenta (lucro cesante evitado, menos días extra de buque, menos premio del grano, igual ahorro neto) y el anexo del pronóstico.
- Lector de cotizaciones en el Simulador Top-off: se pega un documento (o se elige uno de ejemplo), se proponen los cinco valores de costo con la cita de la que sale cada uno, el usuario los confirma y la comparación se recalcula. La lectura la hace Claude; sin clave, sin red o si la llamada falla, se usa una lectura precargada o la carga manual, y la etiqueta lo indica.
- Calendario de análisis, de 2019 a hoy: una fecha pasada muestra las lecturas reales, la proyección hecha solo con datos hasta ese día y lo que ocurrió después. Un botón lleva a la bajante de julio de 2021.
- Anexo con el pronóstico de calado de los 3 días siguientes, dentro de la orden y descargable en CSV (incluye buque e IMO).

## Top-off

El buque carga parcialmente en el Gran Rosario, hasta donde le permite el calado, y navega hacia el sur para completar la carga en otro puerto. La carga no viaja por tren desde Rosario.

Los puertos considerados, en orden de prioridad, son:

1. Bahía Blanca
2. Quequén

Buenos Aires queda descartado: tiene 34 pies de calado y no opera granos.

Cada puerto se compara con la opción de no desviar, que tiene costo y ahorro neto cero. Si todos los puertos dan ahorro neto negativo, "no desviar" es la opción recomendada.

El costo del top-off tiene dos componentes: los días extra de buque (días por el costo diario del buque) y el premio del grano en el puerto de completamiento (USD por tonelada completada). Los valores iniciales están definidos en `.scratch/top-off-demo/spec.md`.

## Datos reales y datos simulados

| Dato | Origen | Estado |
|---|---|---|
| Altura del río (INA) | Media diaria de Rosario, Diamante y La Paz, de la API pública del INA. Se sirve desde un archivo incluido en el repositorio (`api/_ina_historico.py`, desde 2019). | Real. El indicador dice "datos reales (archivo)". |
| Proyección del río | Modelo estadístico (regresión lineal) ajustado con lecturas del INA de 1990 a 2018. Proyecta hasta 5 días desde la última lectura. | Modelo determinístico, no IA. Error medio a 72 hs en 2019-2026: 9,1 cm, contra 13,7 cm de suponer que el río no cambia. |
| Escenario simulado del río | Constantes en `api/main.py` | Demo. Solo se muestra cuando no hay lecturas del INA para la fecha, y la interfaz lo indica. |
| Precio de la soja (BCR) | Scraping con selector provisorio | Usa el valor por defecto de USD 400/tn. El indicador queda en amarillo (`simulado`). |
| Buques (AIS) | Base fija de 3 buques en `api/main.py` | Demo. Nunca se muestra como en vivo. |
| Costos del top-off | Constantes en el frontend | Demo. La excepción es el premio del grano en Bahía Blanca (USD 34/tn), que se rotula "referencia": está dentro del diferencial de precio del maíz que observó Sio Granos sobre Gran Rosario (unos USD 32 a 40/tn en 2021 y 2022). Los días extra y todos los valores de Quequén son demo. Una cotización confirmada por el usuario los reemplaza en pantalla. |
| Lectura de cotizaciones | IA (Claude, API de Anthropic). Sin clave, sin red o si la llamada tarda más de 10 s, se usa una lectura precargada o la carga manual. | Real cuando la etiqueta dice "Leído por IA". La IA solo lee el documento y propone valores; el costo y el ahorro neto se calculan con una fórmula fija. |
| Documentos de ejemplo del lector | Constantes en `api/main.py` | Demo. Son ficticios y la interfaz lo indica. |
| Número de orden de desvío | Constante en el frontend | Demo |

La orden de desvío se muestra como un documento de ejemplo dirigido a la agencia marítima (número de orden, buque, instrucción, costo y ahorro estimados), solo en pantalla: no se envía ni se guarda en ningún sistema.

Supuestos del modelo (no se muestran en la interfaz; se documentan acá y en `AGENTS.md`):

- 2.200 tn perdidas por pie de calado faltante en un Panamax. Cae dentro del rango que cita la BCR (2.000 a 2.500 tn por pie).
- 45.000 tn de carga base. Es un supuesto no verificado: la BCR cita Panamax de 60.000 a 65.000 tn.
- 34 pies de calado de diseño del Panamax, necesarios para la carga completa (`calado_diseno_pies`). Es un supuesto no verificado y no tiene relación con los 34 pies de Buenos Aires.
- Calado máximo seguro = 34 pies cuando el hidrómetro de Rosario marca 2,47 m o más, y 1,7 pies menos por cada metro por debajo. Los 2,47 m son el nivel que cita la BCR para la garantía de 34 pies; los 1,7 pies por metro son un supuesto ajustado con dos reportes de prensa de abril de 2020 (31 pies con cerca de 1 m, y 31'06" con 0,78 m).

`AGENTS.md` es la fuente única de estos números: si uno cambia, se actualiza ahí primero.

## Alcance

Incluido en la demo:

- El dashboard actual.
- Un aviso visible de "datos simulados".
- Un indicador AIS que no se muestra en verde.
- Comparación de Bahía Blanca y Quequén, con una fila "no desviar".
- Una etiqueta de "escenario crítico".
- Un lector de cotizaciones con IA para los costos del top-off.
- Alturas reales del INA y una proyección estadística del río (en construcción: ver .scratch/pronostico-ina/).

Fuera de alcance: scraping de páginas (el precio de la BCR sigue con su valor por defecto), un asistente de chat, AIS en vivo, vista para la agencia marítima y tests.

El flujo principal es: ingresar el IMO, hoy, gráfico, lucro cesante, comparación de puertos, orden de desvío, descargar el anexo en CSV. La interfaz no muestra datos ni cifras hasta que se ingresa un IMO; la demo usa `9436000` (Panamax).

Las reglas de trabajo y el detalle del alcance están en [AGENTS.md](AGENTS.md), que es la fuente de verdad ante cualquier diferencia con este documento.

## Estructura

```
api/main.py          API FastAPI en un solo archivo: scraping, buques, modelo de calado, endpoints
api/_ina_historico.py  lecturas del INA desde 2019 (generado; no editar a mano)
api/requirements.txt
client/src/App.jsx   interfaz React en un solo archivo
AGENTS.md            reglas de trabajo, alcance y supuestos del modelo
.scratch/            specs y tickets (ver .scratch/top-off-demo/)
docs/agents/         configuración del tracker local y las etiquetas de triage
```

Stack: Python 3, FastAPI, Uvicorn, Requests, BeautifulSoup y el SDK `anthropic` en el backend; React 19, Vite, Tailwind 4, Recharts y Lucide en el frontend.

## API

| Endpoint | Descripción |
|---|---|
| `GET /api/pronostico-calado` | Serie de 8 días (4 previos, fecha de análisis y 3 siguientes) con altura, calado seguro, tonelaje recomendado e impacto en USD. |
| `GET /api/pronostico-calado?fecha=YYYY-MM-DD` | Igual, para otra fecha de análisis, entre 2019-01-09 y hoy. Cada punto proyectado trae su rango y, en fechas pasadas, la lectura que ocurrió. |
| `GET /api/pronostico-calado?imo=9436000` | Recalcula con la capacidad del buque indicado. Se puede combinar con `fecha`. |
| `GET /api/buque/{imo}` | Datos del buque (AIS simulado). |
| `GET /api/cotizaciones-ejemplo` | Los tres documentos de ejemplo (ficticios) del lector de cotizaciones. |
| `POST /api/leer-cotizacion` | Lee un documento (`{"texto": "..."}`) y devuelve los cinco costos del top-off con su cita y su origen. |

### IMO de prueba

La base de buques es simulada: los nombres y datos son ficticios. En el campo "Buscador de buque (AIS)" de la interfaz, o en `GET /api/buque/{imo}`, se pueden usar:

| IMO | Buque | Tipo | Carga óptima | Calado de diseño (supuesto) | Pérdida a 72 hs (escenario simulado) |
|---|---|---|---|---|---|
| `9436000` | Agro Pioneer | Panamax | 45.000 tn | 34 ft | 6.900 tn, lucro cesante de USD 2.760.000 |
| `9321483` | Pampa Star | Handymax | 32.000 tn | 30 ft | 0 tn |
| `9512277` | Gran Chaco | Supramax | 55.000 tn | 36 ft | 13.800 tn, lucro cesante de USD 5.520.000 |

- La interfaz arranca pidiendo el IMO y no muestra datos hasta recibirlo. La demo usa `9436000` (Agro Pioneer, Panamax). La API, si se la consulta sin `imo`, usa ese mismo Panamax.
- Con el Handymax `9321483` el escenario simulado no tiene pérdida, y "No desviar" es la mejor opción.
- Un IMO que no está en la tabla devuelve `404` con el mensaje "IMO ... no encontrado".

## Ejecución

Requiere Python 3.10 o superior y Node.js 18 o superior. Se usan dos terminales.

Backend:

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

La documentación interactiva de la API queda en `http://localhost:8000/docs`.

Para que el lector de cotizaciones lea con Claude, definir `ANTHROPIC_API_KEY` en la terminal que corre uvicorn, antes de iniciarlo (nunca en un archivo):

- PowerShell: `$env:ANTHROPIC_API_KEY = "..."`
- bash: `export ANTHROPIC_API_KEY=...`

Sin la clave, el lector responde con las lecturas precargadas de los documentos de ejemplo.

Frontend:

```bash
cd client
npm install
npm run dev
```

Abrir la URL que indique Vite (normalmente `http://localhost:5173`). El frontend consulta `http://localhost:8000/api`, valor fijo de `API_BASE` en `App.jsx`, por lo que el backend debe estar corriendo antes.

Verificación:

```bash
cd client && npm run lint && npm run build
curl localhost:8000/api/pronostico-calado
```

La primera consulta de cada 5 minutos puede demorar unos segundos mientras vencen los timeouts de las fuentes externas. Después responde desde caché.

## Estado actual

El alcance descripto arriba está implementado en el frontend. La especificación y los tickets están en `.scratch/top-off-demo/`, y el ensayo del flujo completo, con los resultados observados, en `.scratch/top-off-demo/issues/04-ensayo-del-demo.md`. La especificación, los tickets y el ensayo del lector de cotizaciones están en `.scratch/ai-hackathon/`.

Pendiente: confirmar a mano, en un navegador con ventana, que la descarga del CSV guarda el archivo. El contenido se verificó, pero la descarga a disco no se pudo observar en el ensayo automatizado.
