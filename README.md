# Calado Predictivo

Panel de decisiones para agroexportadoras del Gran Rosario. Proyecta la altura del Río Paraná en Rosario, calcula el calado máximo seguro de un buque Panamax y traduce la bajante en toneladas no cargadas y lucro cesante en dólares. Compara además en qué puerto conviene completar la carga (top-off).

Es un prototipo de hackathon. Parte de los datos son simulados y la interfaz lo indica (ver "Datos reales y datos de demo").

## Problema

Cuando el Paraná baja, el calado máximo seguro de los buques se reduce y no pueden cargarse a su capacidad óptima. Con el modelo actual, un Panamax pierde unas 2.200 tn por cada pie de calado faltante sobre una carga base de 45.000 tn. Cada tonelada que no se embarca es lucro cesante. Hoy esa decisión se toma reaccionando a la altura del día, sin una proyección del impacto económico.

## Funcionalidad

- Altura del río en Rosario: 4 días de histórico y 3 de proyección.
- Calado máximo seguro (en pies) y tonelaje recomendado para cada día.
- Pérdida de capacidad y lucro cesante a 72 hs. Como un buque se carga una sola vez, el lucro cesante es el del peor día de la ventana, no la suma de los tres.
- Arbitraje de fechas: mejor y peor día de la ventana, y cuánto se ahorra adelantando el zarpe.
- Comparación de puertos de top-off contra la opción de no desviar.
- Calendario de análisis: una fecha pasada muestra el escenario histórico y hoy muestra la proyección.
- Exportación de un reporte en CSV.

## Top-off

El buque carga parcialmente en el Gran Rosario, hasta donde le permite el calado, y navega hacia el sur para completar la carga en otro puerto. La carga no viaja por tren desde Rosario.

Los puertos considerados, en orden de prioridad, son:

1. Bahía Blanca
2. Quequén

Buenos Aires queda descartado: tiene 34 pies de calado y no opera granos.

Cada puerto se compara con la opción de no desviar, que tiene costo y ahorro neto cero. Si todos los puertos dan ahorro neto negativo, "no desviar" es la opción recomendada.

El costo del top-off tiene dos componentes: los días extra de buque (días por el costo diario del buque) y el premio del grano en el puerto de completamiento (USD por tonelada completada). Los valores iniciales están definidos en `.scratch/top-off-demo/spec.md`.

## Datos reales y datos de demo

| Dato | Origen | Estado |
|---|---|---|
| Altura del río (INA) | Scraping con selector provisorio | Usa el valor por defecto de 3,49 m. El indicador queda en amarillo (`simulado`). |
| Precio de la soja (BCR) | Scraping con selector provisorio | Usa el valor por defecto de USD 400/tn. El indicador queda en amarillo (`simulado`). |
| Días previos y proyección | Simulados alrededor de la altura de hoy | Demo |
| Buques (AIS) | Base fija de 3 buques en `api/main.py` | Demo. Nunca se muestra como en vivo. |
| Costos del top-off | Constantes en el frontend | Demo. La excepción es el premio del grano en Bahía Blanca (USD 34/tn), que se rotula "referencia": está dentro del diferencial de precio del maíz que observó Sio Granos sobre Gran Rosario (unos USD 32 a 40/tn en 2021 y 2022). Los días extra y todos los valores de Quequén son demo. |
| Número de orden de desvío | Constante en el frontend | Demo |

La orden de desvío es solo visual: no se envía a ningún sistema.

Supuestos del modelo:

- 2.200 tn perdidas por pie de calado faltante en un Panamax. Cae dentro del rango que cita la BCR (2.000 a 2.500 tn por pie).
- 45.000 tn de carga base. Es un supuesto no verificado: la BCR cita Panamax de 60.000 a 65.000 tn.
- 34 pies de calado de diseño del Panamax, necesarios para la carga completa (`calado_diseno_pies`). Es un supuesto no verificado y no tiene relación con los 34 pies de Buenos Aires ni con los 34 pies de calado garantizado del canal que cita la BCR.
- Calado máximo seguro = (altura del río + 6,0 m de profundidad de canal - 0,6 m de margen bajo quilla) convertido a pies.

`AGENTS.md` es la fuente única de estos números: si uno cambia, se actualiza ahí primero.

## Alcance

Incluido en la demo:

- El dashboard actual.
- Un aviso visible de "datos de demo".
- Un indicador AIS que no se muestra en verde.
- Comparación de Bahía Blanca y Quequén, con una fila "no desviar".
- Supuestos visibles y una etiqueta de "escenario crítico".

Fuera de alcance: scraping real, modelos de ML o LLM, AIS en vivo, vista para la agencia marítima y tests.

El flujo principal es: hoy, gráfico, lucro cesante, comparación de puertos, exportar CSV. El buque por defecto es el Panamax y la demo no requiere vincular un IMO.

Las reglas de trabajo y el detalle del alcance están en [AGENTS.md](AGENTS.md), que es la fuente de verdad ante cualquier diferencia con este documento.

## Estructura

```
api/main.py          API FastAPI en un solo archivo: scraping, buques, modelo de calado, endpoints
api/requirements.txt
client/src/App.jsx   interfaz React en un solo archivo
AGENTS.md            reglas de trabajo, alcance y supuestos del modelo
.scratch/            specs y tickets (ver .scratch/top-off-demo/)
docs/agents/         configuración del tracker local y las etiquetas de triage
```

Stack: Python 3, FastAPI, Uvicorn, Requests y BeautifulSoup en el backend; React 19, Vite, Tailwind 4, Recharts y Lucide en el frontend.

## API

| Endpoint | Descripción |
|---|---|
| `GET /api/pronostico-calado` | Serie de 8 días (4 previos, fecha de análisis y 3 siguientes) con altura, calado seguro, tonelaje recomendado e impacto en USD. |
| `GET /api/pronostico-calado?fecha=YYYY-MM-DD` | Igual, para otra fecha de análisis. Máximo 7 días a futuro. |
| `GET /api/pronostico-calado?imo=9436000` | Recalcula con la capacidad del buque indicado. Se puede combinar con `fecha`. |
| `GET /api/buque/{imo}` | Datos del buque (AIS simulado). |

### IMO de prueba

La base de buques es simulada: los nombres y datos son ficticios. En el campo "Buscador de buque (AIS)" de la interfaz, o en `GET /api/buque/{imo}`, se pueden usar:

| IMO | Buque | Tipo | Carga óptima | Calado de diseño (supuesto) | Pérdida a 72 hs (escenario actual) |
|---|---|---|---|---|---|
| `9436000` | Agro Pioneer | Panamax | 45.000 tn | 34 ft | 13.300 tn, lucro cesante de USD 5.320.000 |
| `9321483` | Pampa Star | Handymax | 32.000 tn | 30 ft | 3.200 tn, lucro cesante de USD 1.280.000 |
| `9512277` | Gran Chaco | Supramax | 55.000 tn | 36 ft | 21.600 tn, lucro cesante de USD 8.640.000 |

- El Panamax es el buque por defecto de la demo: sin vincular ningún IMO se usa Agro Pioneer.
- Para ver el caso en que todos los puertos dan ahorro neto negativo y "No desviar" es la mejor opción, vincular `9321483` y elegir la fecha 2026-10-04.
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

El alcance descripto arriba está implementado en el frontend. La especificación y los tickets están en `.scratch/top-off-demo/`, y el ensayo del flujo completo, con los resultados observados, en `.scratch/top-off-demo/issues/04-ensayo-del-demo.md`.

Pendiente: confirmar a mano, en un navegador con ventana, que la exportación del CSV descarga el archivo. El contenido se verificó, pero la descarga a disco no se pudo observar en el ensayo automatizado.
