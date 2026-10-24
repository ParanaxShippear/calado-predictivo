# Glosario de Calado Predictivo

Para preparar el pitch y el video. Cada término tiene: qué es, una analogía y cómo aparece en la app.

Fuente de verdad: `AGENTS.md` y `README.md` (en ese orden). El código actual es un prototipo previo al alcance y no se usa como referencia.

---

## 1. La historia en 30 segundos

Casi todo el grano que exporta Argentina sale en barco desde los puertos del **Gran Rosario**, sobre el río Paraná. Cuando el río baja (**bajante**), el **calado** máximo seguro de los buques se reduce y **no pueden cargarse a su capacidad óptima**. Cada tonelada que no se embarca es **lucro cesante**. Hoy esa decisión se toma reaccionando a la altura del día, sin una proyección del impacto económico.

Calado Predictivo es un panel de decisiones para la **agroexportadora**. Proyecta la altura del río en Rosario, calcula el calado máximo seguro de un **Panamax** y traduce la bajante en toneladas no cargadas y dólares. Recomienda dos salidas:
1. **Arbitraje de fechas**: elegir el mejor día de la ventana para zarpar.
2. **Top-off**: cargar parcial en Rosario y completar la carga en **Bahía Blanca** o **Quequén**, comparado contra la opción de **no desviar**.

---

## 2. El río y el barco

### Calado
**Qué es:** la distancia vertical entre la línea de flotación y el punto más bajo del casco (la quilla). Es cuánto se hunde el barco en el agua.
**Analogía:** una persona que se mete al agua con una mochila: cuanto más pesada, más se hunde.
**Regla clave:** más carga = más calado. Si el río permite poco calado, el barco tiene que salir con menos carga.
**En la app:** "calado máximo seguro", en pies, para cada día de la ventana.

### Pie (ft)
Unidad que usa la industria naviera. 1 pie = 0,3048 m (1 m ≈ 3,28 pies). Todos los calados se hablan en pies.

### Bajante
**Qué es:** período en que el Paraná está más bajo de lo normal, por sequía en la cuenca (Brasil, Paraguay). La de 2020-2022 fue la peor en décadas.
**Por qué importa:** es el problema que resuelve la app. Bajante = menos calado = buques que salen sin carga completa.
**En la app:** cuando la situación es grave aparece la etiqueta **"escenario crítico"**.

### Altura del río (altura hidrométrica)
**Qué es:** el nivel del río medido en una escala fija en el puerto de Rosario. **No es la profundidad:** es cuántos metros está el agua sobre el "cero" de esa escala.
**Analogía:** la marca de un vaso medidor: no dice cuán profundo es el vaso, dice cuánto subió el agua respecto de una marca.
**En la app:** dato de entrada. Fuente: **INA**. Valor por defecto: 3,49 m.

### Profundidad de canal
Lo que hay que sumarle a la altura del río para llegar a la profundidad real disponible. El modelo usa **6,0 m**.

### Margen bajo quilla (UKC, *Under Keel Clearance*)
El espacio de seguridad que tiene que quedar entre el fondo del barco y el lecho del río. Nadie navega rozando el fondo. El modelo usa **0,6 m**.

### Hidrovía Paraná-Paraguay
La "autopista fluvial" por la que bajan los barcos desde Rosario al océano. Se draga (se excava el fondo) para mantener su profundidad.

### Gran Rosario
El polo de puertos y terminales sobre el Paraná alrededor de Rosario (San Lorenzo, Timbúes, General Lagos, etc.). Es donde el buque hace la carga parcial antes del top-off.

### Zarpe
El momento en que el buque sale del puerto. "Adelantar el zarpe" = salir antes, en un día con más agua.

---

## 3. Los barcos

### Panamax
**Qué es:** categoría de buque definida por las medidas máximas que entraban en las esclusas originales del Canal de Panamá. Es el granelero típico que carga en Rosario.
**Por qué importa:** puede llevar más carga de la que el Paraná le permite en bajante.
**En la app:** es el **buque por defecto**. El modelo asume **45.000 tn de carga base** y pierde **2.200 tn por cada pie de calado faltante**.

### Handymax / Supramax
Graneleros más chicos que un Panamax. Existen como ejemplos en la API, pero **no forman parte de la demo**: el pitch usa solo el Panamax.

### Eslora
El largo del barco, de proa a popa.

### DWT (*Deadweight Tonnage*, porte bruto)
Cuánto peso total puede llevar el barco (carga, combustible, agua, tripulación). Sirve para explicar que un Panamax podría llevar más de lo que el río le deja.

---

## 4. Identificar y seguir barcos

### IMO (número IMO)
**Qué es:** el "DNI" del barco. Número de 7 dígitos que se asigna al construirlo y **no cambia nunca**, aunque el barco cambie de nombre, dueño o bandera.
**De dónde viene:** de la Organización Marítima Internacional (IMO; en español, OMI), la agencia de la ONU que regula el transporte marítimo.
**Analogía:** el número de chasis de un auto: la patente puede cambiar, el chasis no.
**En la app:** la API permite consultar un buque por IMO, pero **en la demo nadie vincula un IMO**: se usa el Panamax por defecto.

### AIS (*Automatic Identification System*)
**Qué es:** un transmisor de radio (VHF) a bordo que emite cada pocos segundos quién es el barco y dónde está: posición, velocidad, rumbo, nombre, IMO y calado declarado. Es obligatorio para buques grandes en viajes internacionales.
**Analogía:** el GPS de un Uber que cualquiera puede ver en el mapa.
**Por qué importa:** permite saber qué barcos llegan a Rosario y con qué calado.
**Limitación:** el calado que manda el AIS lo carga a mano la tripulación y suele estar desactualizado.
**En la app:** **siempre simulado** (base fija de 3 buques). El indicador AIS **nunca se muestra en verde** ni como "en vivo". El AIS en vivo está **fuera de alcance**.

### MMSI
Otro identificador (9 dígitos), pero del equipo de radio, no del barco. Puede cambiar. El AIS transmite el MMSI; para saber qué barco es de verdad se cruza con el IMO.

---

## 5. La plata

### Lucro cesante
**Qué es (término legal y contable):** lo que **dejás de ganar** por un problema. No es lo que gastaste.
**Analogía:** si tu taxi se rompe, el arreglo es un costo; los viajes que no hiciste mientras estaba en el taller son lucro cesante.
**En la app:** toneladas no cargadas × precio de la soja (**BCR**). Se muestra la pérdida de capacidad y el lucro cesante **a 72 hs**.
**Ojo para el jurado:** en rigor ese número es el **valor de la mercadería que queda en tierra**, no la ganancia neta perdida. Si preguntan, decirlo así.

### Falso flete (*dead freight*)
**Qué es:** si contratás un barco para 45.000 tn y cargás menos, igual pagás el flete del espacio vacío.
**Analogía:** alquilar un camión de mudanza grande y llenar la mitad: pagás el camión entero.
**Por qué importa:** es un costo directo de la bajante, fácil de entender. Refuerza el argumento del lucro cesante.

### Top-off
**Qué es:** el buque **carga parcialmente en el Gran Rosario**, hasta donde le permite el calado, y **navega hacia el sur para completar la carga** en un puerto de aguas profundas.
**Analogía:** cargar nafta a medias porque hay cola y llenar el tanque en la próxima estación.
**Puertos, en orden de prioridad:**
1. **Bahía Blanca**
2. **Quequén** (Necochea)

**Buenos Aires no es opción:** tiene 34 pies de calado y no opera granos.
**Nunca decir** que la carga viaja en tren desde Rosario: es el **barco** el que va a completar al sur.
**Costo del top-off (demo), dos componentes:**
1. **Días extra de buque** (navegar hasta el puerto y operar ahí).
2. **Premium del grano** en el puerto de completamiento (comprar grano ahí suele costar más).

### No desviar
La opción de referencia: el buque sale con lo que pudo cargar en Rosario y no hace top-off. Cada puerto se compara contra esta fila. Si el top-off cuesta más de lo que recupera, la recomendación es **no desviar**.

### Demurrage (estadía)
Lo que se paga por cada día que el buque queda parado más tiempo del pactado. Ayuda a explicar por qué los "días extra de buque" cuestan plata.

### Arbitraje de fechas
**Qué es:** aprovechar la diferencia entre días: elegir el día en que el río va a estar más alto para cargar más.
**En la app:** muestra el **mejor y el peor día de la ventana** y **cuánto se ahorra adelantando el zarpe**.

### FOB (*Free On Board*)
Forma típica de vender grano: el vendedor lo pone arriba del barco y desde ahí el riesgo y el flete son del comprador. Por eso a la agroexportadora le importa tanto cuánto logra subir al barco.

### Agroexportadora
Empresa que compra grano a productores y lo vende al exterior (por ejemplo, Cargill, Bunge, COFCO, AGD). Es la **persona principal** de la app.

---

## 6. Conceptos de la app

### Ventana
Los 8 días que muestra el panel: **4 días de histórico**, la fecha de análisis y **3 días de proyección**.

### Calendario de análisis
Elegir una fecha pasada muestra el escenario histórico; elegir hoy muestra la proyección.

### Golden path (recorrido del pitch)
El orden en que se muestra la demo: **hoy → gráfico → lucro cesante → comparación de puertos de top-off → exportar CSV**.

### Orden de desvío
Un número de orden que la app muestra al elegir un puerto. Es **solo visual y de demo**: no se envía a ningún sistema.

### Exportar CSV
Descarga un reporte con los números del análisis, para llevarlo a una planilla.

### Badge "datos de demo"
Mientras alguna fuente esté simulada, la app muestra un único aviso visible de "datos de demo". Regla del equipo: **los datos de demo se pueden usar, pero nunca sin etiqueta**.

### Supuestos visibles
La app muestra los supuestos del modelo en pantalla (ver sección 8), para que el jurado vea de dónde sale cada número.

---

## 7. Las fuentes de datos

| Sigla / dato | Qué es | Qué le pedimos | Estado en la demo |
|---|---|---|---|
| **INA** | Instituto Nacional del Agua. Publica alturas del Paraná. | Altura del río en Rosario. | Se intenta leer; si falla, 3,49 m e indicador amarillo (`simulado`). |
| **BCR** | Bolsa de Comercio de Rosario. Publica precios de referencia de granos. | Precio de la soja en USD/tn. | Se intenta leer; si falla, USD 400/tn e indicador amarillo (`simulado`). |
| Proyección | Días previos y próximos alrededor de la altura de hoy. | | Demo. |
| **AIS** | Señal de posición de los barcos. | Qué barcos llegan y con qué calado. | Siempre demo. Nunca en verde. |
| Costos del top-off | Días extra de buque + premium del grano. | | Demo. |
| Orden de desvío | Número de orden. | | Demo, solo visual. |

---

## 8. Cómo calcula la app (ejemplo con números de demo)

Supuestos del modelo (únicos, definidos en `AGENTS.md`):
- 2.200 tn perdidas por pie de calado faltante en un Panamax.
- 45.000 tn de carga base.
- Calado máximo seguro = (altura del río + 6,0 m de profundidad de canal − 0,6 m de margen bajo quilla), convertido a pies.

Ejemplo:
1. **Altura del río en Rosario:** 3,49 m.
2. **Profundidad útil:** 3,49 + 6,0 − 0,6 = 8,89 m.
3. **Calado máximo seguro:** 8,89 m × 3,28 ≈ **29,2 pies**.
4. **Pies faltantes:** la diferencia entre el calado que necesita el Panamax para las 45.000 tn y 29,2 pies. Si necesitara 34 pies, faltarían 4,8 pies. *(Pendiente: el README no fija ese calado de referencia; confirmarlo antes del pitch.)*
5. **Toneladas perdidas:** 4,8 × 2.200 ≈ **10.600 tn** no cargadas (sale con ~34.400 tn en vez de 45.000).
6. **Lucro cesante:** 10.600 tn × USD 400 ≈ **USD 4,2 millones** por buque.
7. **Top-off:** se compara lo que se recupera completando en Bahía Blanca o Quequén contra sus dos costos de demo, y contra **no desviar**.

Son aproximaciones razonables para la demo, no valores calibrados.

---

## 9. Qué es real y qué es demo

- **Se intenta real:** altura del río (INA) y precio de la soja (BCR), con valor por defecto si falla.
- **Demo:** proyección, buques (AIS), costos del top-off, número de orden.
- **Fuera de alcance:** scraping real terminado, AIS en vivo, modelos de ML o LLM, vista para la agencia marítima, tests.

Nunca decir en el pitch que el AIS, los datos del INA/BCR o una IA están "en vivo".

---

## 10. Preguntas probables del jurado

- **"¿De dónde sale la proyección del río?"** En la demo es simulada alrededor de la altura de hoy, y está marcada como "datos de demo".
- **"¿Por qué no usan AIS real?"** Está fuera del alcance del MVP. Además, el calado que manda el AIS lo carga la tripulación a mano. Lo simulamos y lo marcamos.
- **"¿Los USD 4 millones son ganancia perdida?"** Es el valor de la carga que queda en tierra. La ganancia neta depende del margen, pero el orden de magnitud muestra el problema.
- **"¿Por qué Bahía Blanca y no Buenos Aires?"** Buenos Aires tiene 34 pies de calado y no opera granos. Bahía Blanca y Quequén son de aguas profundas.
- **"¿La carga va en tren?"** No. El buque carga parcial en Rosario y navega al sur a completar.
- **"¿Y si el top-off no conviene?"** La app lo muestra: la fila "no desviar" es la referencia.
- **"¿Quién paga por esto?"** La agroexportadora: una sola decisión bien tomada en una bajante vale millones.
