# Pitch de Calado Predictivo (2 minutos)

Track: **Finanzas**. Fuente de verdad: `AGENTS.md`, `README.md` y `docs/glosario.md`.

Unas 290 palabras habladas, que a ritmo tranquilo dan 1:50. Quedan unos 10 segundos de margen para clics y pausas.

---

## Guion

### 0:00 – 0:15 · Gancho
> Un barco espera en Rosario para cargar 45.000 toneladas de soja. Pero el río bajó. Sale con 34.000. Las otras 10.000 quedan en tierra: más de 4 millones de dólares que no se embarcan. En un solo barco.

*[Pantalla: logo o título. Todavía no se muestra la app.]*

### 0:15 – 0:35 · Problema
> Casi todo el grano que exporta la Argentina sale por el Gran Rosario, sobre el Paraná. Cuando el río baja, el barco no puede hundirse tanto (eso es el calado) y tiene que salir más liviano. Cada pie de calado que falta son 2.200 toneladas menos. Y hoy el exportador decide mirando la altura del río del día: reacciona, no anticipa.

### 0:35 – 0:50 · Solución
> Calado Predictivo es un panel de decisiones para la agroexportadora. Toma la altura del río y el precio de la soja, proyecta los próximos días y traduce la bajante a lo que le importa al negocio: toneladas y dólares.

*[Pantalla: se abre el dashboard en la fecha de hoy.]*

### 0:50 – 1:35 · Demo (golden path)
> Hoy el río está en 3,49 metros: el calado seguro es de 29 pies. *[gráfico]* Acá vemos cuatro días atrás y tres adelante. *[lucro cesante]* Y esto es lo que perdemos en las próximas 72 horas.
>
> La app propone dos salidas. Primera: **arbitraje de fechas**. Me marca el mejor día de la ventana y cuánto ahorro si adelanto el zarpe.
>
> Segunda: **top-off**. El barco carga lo que puede en Rosario y baja a completar en Bahía Blanca o Quequén, que son puertos de aguas profundas. *[tabla de puertos]* La app compara cada puerto contra no desviar, descontando los días extra de buque y el premium del grano, y marca la opción que más conviene.
>
> *[exportar CSV]* Exporto el reporte y lo llevo a la mesa de decisión.

### 1:35 – 1:50 · Por qué importa
> La bajante de 2020 a 2022 fue la peor en décadas, y no va a ser la última. Con una sola decisión bien tomada, la herramienta ya se pagó muchas veces.

### 1:50 – 2:00 · Cierre
> Hoy usamos datos de demo, marcados en pantalla, pero el modelo ya calcula. Calado Predictivo: que la bajante sea un número, no una sorpresa.

---

## Roles sugeridos

- **Orador:** dice el guion completo. Una sola voz da más claridad en 2 minutos.
- **Operador:** maneja la app y sigue las marcas *[entre corchetes]*. No habla.
- **Respaldo:** tiene la ayuda memoria del glosario (sección 10) para las preguntas.

## Reglas para no perder puntos

- **No decir "en vivo", "tiempo real" ni "IA".** El AIS es simulado, el INA y la BCR caen al valor por defecto y el MVP no usa machine learning.
- **Nombrar los datos de demo antes de que lo haga el jurado.** El cierre ya lo hace.
- **No decir que la carga va en tren.** El que baja a completar es el barco.
- **No mencionar Buenos Aires** como puerto de top-off.
- **No mostrar el IMO.** La demo usa el Panamax por defecto.

## Si la demo falla

Tener capturas de pantalla de los 4 momentos (dashboard de hoy, lucro cesante, tabla de puertos, CSV) y pasarlas como diapositivas con el mismo texto. El guion no cambia.

## Antes de ensayar, confirmar

1. **Los 4 millones del gancho.** Salen del ejemplo del glosario (sección 8), que supone que el Panamax necesita 34 pies para las 45.000 tn. Ese calado de referencia no está fijado en el README. Si cambia, ajustar las cifras "34.000", "10.000" y "4 millones".
2. **Que la app ya muestre lo que dice el guion.** Según "Estado actual" del README, faltan la tabla de puertos con la fila "no desviar", el aviso de "datos de demo" y la corrección del lucro cesante a 72 hs. Si no llegan, recortar esa parte de la demo y contarla con una captura o un mockup.
3. **Cronometrar dos ensayos completos** con la app abierta. Si se pasa de 2:00, lo primero que se recorta es la frase de la bajante 2020-2022.
