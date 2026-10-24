# Pitch de Calado Predictivo (2 minutos)

Equipo **ParanaLove** · Track: **Finanzas**. Fuente de verdad: `AGENTS.md`, `README.md`, `docs/hackathon-submission.md` y `docs/glosario.md`. Si alguna cifra de este guion no coincide con esos documentos, mandan ellos.

Unas 300 palabras habladas, que a ritmo tranquilo dan 1:50. Quedan unos 10 segundos de margen para clics y pausas.

---

## Guion

### 0:00 – 0:15 · Gancho
> Un Panamax espera en Rosario para cargar 45.000 toneladas de soja. Pero el río bajó. En los próximos tres días, en el peor momento, van a quedar en tierra 13.300 toneladas: más de 5 millones de dólares que no se embarcan. En un solo barco.

*[Pantalla: logo o título. Todavía no se muestra la app.]*

### 0:15 – 0:35 · Problema
> Tres de cada cuatro toneladas de granos, harinas y aceites que exporta la Argentina salen por el Gran Rosario, sobre el Paraná. Cuando el río baja, el barco no puede hundirse tanto (eso es el calado) y tiene que salir más liviano: cada pie que falta son 2.200 toneladas menos. El exportador ya hace estas cuentas, pero por separado: la altura del río en un lado, el calado en otro, los dólares perdidos y el costo de cada alternativa en planillas distintas. Y todo eso lo cruza a mano.

### 0:35 – 0:50 · Solución
> Calado Predictivo junta esos cálculos en un solo panel. Toma la altura del río y el precio de la soja, proyecta los próximos días y traduce la bajante a lo que le importa al negocio: toneladas y dólares.

*[Pantalla: se abre el dashboard en la fecha de hoy.]*

### 0:50 – 1:35 · Demo (golden path)
> Hoy el río está en 3,49 metros: el calado seguro es de 29 pies. *[gráfico]* Acá vemos cuatro días atrás y tres adelante. *[lucro cesante]* Y esto es lo que perdemos en el peor día de las próximas 72 horas. Es el peor día y no la suma, porque el barco se carga una sola vez.
>
> La app propone dos salidas. Primera: **arbitraje de fechas**. Me marca el mejor día de la ventana y cuánto ahorro si adelanto el zarpe.
>
> Segunda: **top-off**. El barco carga lo que puede en Rosario y baja a completar en Bahía Blanca o Quequén, que son puertos de aguas profundas. *[tabla de puertos]* La app compara cada puerto contra no desviar, restando los días extra de buque y el premio del grano en el puerto, y marca la opción que más conviene. Si desviar no paga, recomienda no desviar.
>
> *[exportar CSV]* Exporto el reporte y lo llevo a la mesa de decisión.

### 1:35 – 1:50 · Por qué importa
> Según la Bolsa de Comercio de Rosario, entre marzo y agosto de 2021 la bajante le costó a los exportadores del Gran Rosario más de 300 millones de dólares: barcos que salen sin llenar, cargas que se completan en otros puertos y harina y aceite vendidos más baratos. Con una sola decisión bien tomada, la herramienta ya se pagó muchas veces.

### 1:50 – 2:00 · Cierre
> Hoy usamos datos de demo, marcados en pantalla, pero el modelo ya calcula. Calado Predictivo: que la bajante sea un número, no una sorpresa.

---

## Roles sugeridos

- **Orador:** dice el guion completo. Una sola voz da más claridad en 2 minutos.
- **Operador:** maneja la app y sigue las marcas *[entre corchetes]*. No habla.
- **Respaldo:** tiene la ayuda memoria del glosario (sección 10) para las preguntas.

## Reglas para no perder puntos

- **No decir que hoy nadie lo hace.** El exportador ya decide, pero con la información separada y cruzada a mano. Lo nuevo es unificarla.
- **No decir "en vivo", "tiempo real" ni "IA en vivo".** El AIS es simulado, el INA y la BCR caen al valor por defecto, y la proyección es simulada con reglas determinísticas. Si el jurado pregunta por IA, contestar como el formulario: el siguiente paso es un modelo entrenado con series históricas del INA.
- **Nombrar los datos de demo antes de que lo haga el jurado.** El cierre ya lo hace.
- **No decir que la carga va en tren.** El que baja a completar es el barco.
- **No mencionar Buenos Aires** como puerto de top-off.
- **No mostrar el IMO.** La demo usa el Panamax por defecto (Agro Pioneer).
- **No usar la frase de que el río "se volvió más impredecible por el clima".** Está en el formulario pero no tiene fuente.

## Si la demo falla

Tener capturas de pantalla de los 4 momentos (dashboard de hoy, lucro cesante, tabla de puertos, CSV) y pasarlas como diapositivas con el mismo texto. El guion no cambia.

## Para el video

El video sigue el plan de `docs/hackathon-submission.md`: 0:00–0:45 negocio (gancho, problema y solución de este guion), 0:45–1:45 la demo grabada con el mismo texto, y 1:45–2:00 el clip de cierre. Decir "datos de demo" en voz alta durante la grabación.

## Antes de ensayar, confirmar

1. **Las cifras del gancho y de la demo.** Las 13.300 tn y los USD 5,3 M son los que el README da para el Panamax en el escenario actual. Los 3,49 m y los 29 pies dependen de la altura del día. Antes de grabar, abrir la app y copiar los números que muestra.
2. **Que 45.000 tn y 34 pies son supuestos del modelo.** La BCR cita Panamax de 60.000 a 65.000 tn. Si el jurado pregunta, decirlo así. Lo que sí está respaldado es el rango de 2.000 a 2.500 tn por pie.
3. **Las fuentes de las cifras de mercado.** El 75% y los más de USD 300 M salen de resúmenes de búsqueda. Abrir los links de `docs/hackathon-submission.md` antes de citarlos.
4. **La descarga del CSV** en un navegador con ventana. Es lo único que el README marca como pendiente.
5. **Cronometrar dos ensayos completos** con la app abierta. Si se pasa de 2:00, lo primero que se recorta es la explicación de por qué es el peor día y no la suma.
