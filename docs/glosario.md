# Glosario de Calado Predictivo

Para preparar el pitch y el video. Cada término tiene: qué es, una analogía y cómo aparece en la app.

---

## 1. La historia en 30 segundos

Casi todo el grano que exporta Argentina sale en barco desde los puertos del **Gran Rosario**, sobre el río Paraná. El río no es un océano: tiene una profundidad limitada. Cuando el río baja (**bajante**), los barcos se hunden menos en el agua permitida, o sea tienen menos **calado** disponible, y **no pueden cargar completos**. Cada tonelada que no sube al barco es plata que se pierde (**lucro cesante** y **falso flete**).

Calado Predictivo anticipa cuánto va a bajar el río, calcula cuántas toneladas se van a perder y recomienda dos salidas:
1. **Arbitraje de fechas**: cargar el día en que el río esté más alto.
2. **Top-off**: cargar parcial en Rosario y completar la carga en un puerto de aguas profundas (**Bahía Blanca** o **Quequén**).

---

## 2. El río y el barco

### Calado
**Qué es:** la distancia vertical entre la línea de flotación y el punto más bajo del casco (la quilla). Es cuánto se hunde el barco en el agua.
**Analogía:** como una persona que se mete al agua con una mochila: cuanto más pesada la mochila, más se hunde. Un barco más cargado tiene más calado.
**Regla clave:** más carga = más calado. Si el río permite poco calado, el barco tiene que ir con menos carga.
**En la app:** "calado máximo seguro", en pies.

### Pie (ft)
**Qué es:** unidad de medida que usa la industria naviera. 1 pie = 0,3048 m (1 m = 3,28 pies).
**Por qué importa:** todos los calados se hablan en pies. "El canal da 34 pies" es una frase típica.

### Bajante
**Qué es:** período en que el río Paraná está más bajo de lo normal, por sequía en la cuenca (Brasil, Paraguay). La de 2020-2022 fue la peor en casi 80 años.
**Por qué importa:** es el problema que resuelve la app. Bajante = menos calado = barcos que salen a medio cargar.
**En la app:** la etiqueta "escenario crítico".

### Altura del río (altura hidrométrica)
**Qué es:** el nivel del río medido en una regla (escala) fija en el puerto de Rosario. **Ojo: no es la profundidad.** Es cuántos metros está el agua por encima del "cero" de esa regla.
**Analogía:** la marca en un vaso medidor: no te dice cuán profundo es el vaso, te dice cuánto subió el agua respecto de una marca.
**En la app:** dato de entrada (fallback de demo: 3,49 m). La fuente es el **INA**.

### Margen bajo quilla (UKC, *Under Keel Clearance*)
**Qué es:** el espacio de seguridad que tiene que quedar entre el fondo del barco y el lecho del río. Nadie navega "rozando" el fondo.
**En la app:** 0,6 m, descontados de la profundidad del canal.

### Hidrovía Paraná-Paraguay
**Qué es:** la "autopista fluvial" de más de 3.000 km por la que bajan los barcos. Hay que dragarla (excavar el fondo) para mantener su profundidad. En el tramo de Rosario al océano, el canal está diseñado para unos 34 pies.

### Gran Rosario (Up-River)
**Qué es:** el polo de puertos y terminales sobre el Paraná alrededor de Rosario (San Lorenzo, Timbúes, Gral. Lagos, etc.). Es el principal nodo agroexportador del mundo para harina y aceite de soja. Por acá sale la gran mayoría del grano argentino.

---

## 3. Los barcos

### Panamax
**Qué es:** tamaño de buque definido por las medidas máximas que entraban en las esclusas originales del Canal de Panamá (aprox. 32 m de manga y 225-230 m de eslora). Es el barco granelero típico que carga en Rosario.
**Por qué importa:** es grande y puede llevar más carga de la que el Paraná le permite. Por eso sufre la bajante.
**En la app:** es el buque por defecto ("Agro Pioneer", 225 m, 45.000 tn, calado de diseño 34 pies). Hay también un Handymax y un Supramax de ejemplo.

### Handymax / Supramax
Otras categorías de graneleros, más chicos que un Panamax. Sirven para mostrar que el modelo cambia según el tamaño del barco.

### Eslora
El largo del barco, de proa a popa.

### Calado de diseño
El calado que tendría el barco cargado a la capacidad que usamos como referencia. Si el río no da ese calado, el barco no puede cargar completo.

### DWT (*Deadweight Tonnage*, porte bruto)
Cuánto peso total puede llevar el barco (carga + combustible + agua + tripulación). Un Panamax ronda las 60.000-80.000 DWT en el océano, pero en el Paraná carga bastante menos por el límite de calado.

---

## 4. Identificar y seguir barcos

### IMO (número IMO)
**Qué es:** el "DNI" del barco. Número de 7 dígitos (por ejemplo, IMO 9436000) que se asigna cuando se construye y **no cambia nunca**, aunque el barco cambie de nombre, dueño o bandera.
**De dónde viene:** de la **Organización Marítima Internacional** (IMO, en español OMI), la agencia de la ONU que regula el transporte marítimo.
**Analogía:** el número de chasis de un auto. La patente puede cambiar, el chasis no.
**En la app:** se puede consultar un buque por IMO. En la demo no se vincula ninguno; se usa el Panamax por defecto.

### AIS (*Automatic Identification System*)
**Qué es:** un transmisor de radio (VHF) que los barcos llevan a bordo y que emite cada pocos segundos quién son y dónde están: posición, velocidad, rumbo, nombre, IMO y calado declarado. Es obligatorio para buques grandes en viajes internacionales.
**Analogía:** el GPS de un Uber que todos pueden ver en el mapa.
**Por qué importa:** permite saber qué barcos están llegando a Rosario y qué calado traen.
**Limitación:** el calado que manda el AIS lo carga a mano la tripulación y suele estar desactualizado.
**En la app:** **siempre simulado**. El indicador de AIS nunca se pone verde. Integrarlo en vivo es parte del roadmap, no de la demo.

### MMSI
Otro identificador del barco (9 dígitos), pero de su equipo de radio. Puede cambiar. El AIS transmite el MMSI; para saber "qué barco es" de verdad se cruza con el IMO.

---

## 5. La plata

### Lucro cesante
**Qué es (término legal y contable):** la ganancia que dejás de percibir por un problema. No es lo que gastaste, sino lo que **dejaste de ganar**.
**Analogía:** si tu taxi se rompe, el arreglo es un costo; los viajes que no hiciste mientras estaba en el taller son lucro cesante.
**En la app:** toneladas no cargadas × precio de la soja (BCR). Con los valores de demo da unos USD 4,25 millones (ver ejemplo abajo).
**Ojo para el jurado:** en rigor, ese número es el **valor de la mercadería que no se embarcó**, no la ganancia neta perdida. Es la medida de cuánto negocio queda en tierra. Si preguntan, decirlo así.

### Falso flete (*dead freight*)
**Qué es:** cuando contratás un barco para llevar, por ejemplo, 45.000 tn y cargás menos, igual pagás el flete por el espacio vacío.
**Analogía:** alquilar un camión de mudanza grande y llenar la mitad: pagás el camión entero.
**Por qué importa:** es un costo directo y fácil de entender de la bajante. Refuerza el argumento del lucro cesante.

### Top-off
**Qué es:** cargar el barco parcialmente en Rosario (hasta donde el río permite) y **completar la carga** en otro puerto más profundo en el camino al océano.
**Analogía:** cargar nafta a medias porque el surtidor tiene cola y llenar el tanque en la próxima estación de servicio.
**Puertos de la app, por prioridad:**
1. **Bahía Blanca**: puerto de aguas profundas en el sur de Buenos Aires, con terminales de granos.
2. **Quequén** (Necochea): puerto de aguas profundas con terminales de granos.
- Buenos Aires **no** es opción: su canal da unos 34 pies y no opera granos a granel.
**Importante:** es el **barco** el que navega hacia el sur a completar. **No** decir que la carga va en tren desde Rosario.
**Costos del top-off (demo):** días extra de barco navegando y esperando + la prima que cuesta comprar grano en el puerto de completamiento. En la app, un costo de desvío de demo de USD 450.000.

### Demurrage (estadía)
Lo que paga el que alquila el barco por cada día que el buque queda parado más tiempo del pactado. Es parte de los "días extra" del top-off.

### Arbitraje de fechas
**Qué es:** elegir el día de carga en que el río va a estar más alto, para cargar más. "Arbitraje" = aprovechar una diferencia (acá, entre días).
**En la app:** el gráfico de proyección del río muestra qué fecha conviene.

### FOB (*Free On Board*)
Forma típica de vender grano: el vendedor lo pone arriba del barco y desde ahí el riesgo y el flete son del comprador. Por eso a la agroexportadora le importa tanto cuánto **logra subir** al barco.

### Agroexportadora
Empresa que compra grano a productores y lo vende al exterior (por ejemplo, Cargill, Bunge, COFCO, AGD). Es el **usuario principal** de la app.

---

## 6. Las fuentes de datos

| Sigla | Qué es | Qué le pedimos | Estado en la demo |
|---|---|---|---|
| **INA** | Instituto Nacional del Agua. Publica alturas y pronósticos del Paraná. | Altura del río en Rosario. | Intento de dato real; si falla, valor de demo (indicador amarillo, `simulado`). |
| **BCR** | Bolsa de Comercio de Rosario. Publica precios de referencia de granos. | Precio de la soja en USD/tn. | Intento de dato real; si falla, USD 400 (`simulado`). |
| **AIS** | Señal de posición de los barcos. | Qué barcos llegan y con qué calado. | Siempre simulado. |

Regla del equipo: los datos de demo se pueden usar, pero siempre etiquetados. La app muestra el badge **"datos de demo"**.

---

## 7. Cómo calcula la app (ejemplo con números de demo)

1. **Altura del río en Rosario:** 3,49 m.
2. **Profundidad útil:** 3,49 m + 6,0 m (offset del canal) − 0,6 m (margen bajo quilla) = 8,89 m.
3. **Calado máximo seguro:** 8,89 m × 3,28 = **29,2 pies**.
4. **Faltante:** el Panamax necesita 34 pies → faltan 4,8 pies.
5. **Toneladas perdidas:** 4,8 pies × 2.200 tn por pie ≈ **10.600 tn** que no se cargan. El barco sale con ~34.400 tn en vez de 45.000.
6. **Impacto:** 10.600 tn × USD 400 ≈ **USD 4,25 millones**.
7. **Top-off en Bahía Blanca:** se recupera la carga pagando ~USD 450.000 de desvío → beneficio neto ≈ **USD 3,8 millones**.

Supuestos del modelo (están visibles en la app): 2.200 tn por pie de calado y 45.000 tn de carga base. Son aproximaciones razonables para la demo, no valores calibrados.

---

## 8. Qué es real y qué es demo

- **Real (intento):** altura del río (INA) y precio de la soja (BCR), con fallback.
- **Demo:** proyección de los próximos días, buques (AIS), costos del top-off, número de orden.
- **No existe en la demo:** AIS en vivo, modelo de IA o machine learning, vista para agencias marítimas.

Nunca decir en el pitch que el AIS, los datos del INA/BCR o una IA están "en vivo" si la app muestra "simulado".

---

## 9. Preguntas probables del jurado

- **"¿De dónde sacan la proyección del río?"** Hoy es de demo. El siguiente paso es usar los pronósticos que el INA ya publica.
- **"¿Por qué no usan AIS real?"** Las fuentes buenas son pagas y el calado del AIS lo carga la tripulación a mano. Para el MVP lo simulamos y lo marcamos.
- **"¿Los USD 4 millones son ganancia perdida?"** Es el valor de la carga que no se embarca. La ganancia neta perdida depende del margen, pero el orden de magnitud muestra el problema.
- **"¿Por qué Bahía Blanca y no Buenos Aires?"** Buenos Aires no tiene más calado que Rosario ni opera granos a granel. Bahía Blanca y Quequén son de aguas profundas.
- **"¿Quién paga por esto?"** La agroexportadora: una sola decisión bien tomada en una bajante vale millones.
