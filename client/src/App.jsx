import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Anchor,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Download,
  Radar,
  Route,
  Send,
  ShieldCheck,
  Ship,
  TrendingDown,
  Waves,
  X,
} from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

// DEMO: costos del top-off. El buque carga parcial en Gran Rosario y navega al sur a completar.
// Costo = días extra × costo diario del buque + premio del grano × toneladas completadas.
const COSTO_DIARIO_BUQUE_USD = 40_000 // DEMO
const NUMERO_ORDEN_DEMO = 482 // DEMO
const PUERTOS_TOP_OFF = [
  // Premio de Bahía Blanca: referencia (dentro del diferencial del maíz de Sio Granos sobre Gran Rosario,
  // ~USD 32 a 40/tn en 2021-2022). Los 5 días extra y todos los valores de Quequén son DEMO.
  { id: 'bahia-blanca', nombre: 'Bahía Blanca', diasExtra: 5, premioUsdTn: 34, premioEsReferencia: true },
  { id: 'quequen', nombre: 'Quequén', diasExtra: 4, premioUsdTn: 38, premioEsReferencia: false },
]

const fmtTn = (n) => `${n.toLocaleString('es-AR')} tn`
const fmtUsd = (n) => `USD ${n.toLocaleString('es-AR')}`
const fmtUsdPerdida = (n) => `${n === 0 ? '' : '-'}${fmtUsd(Math.abs(n))}`
const fmtDec = (n, d) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtM = (n) => `${fmtDec(n, 2)} m`
const fmtFt = (n) => `${fmtDec(n, 2)} ft`
const fmtUsdConSigno = (n) => `${n < 0 ? '-' : '+'}${fmtUsd(Math.abs(n))}`
const fecha12 = (iso) => new Date(`${iso}T12:00:00`)
const diaSemana = (iso) => fecha12(iso).toLocaleDateString('es-AR', { weekday: 'long' })
const diaMes = (iso) => fecha12(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)
// "Martes 27/10" para tablas y ejes; "martes 27/10" dentro de una frase. El día va siempre completo.
const fmtFecha = (iso) => `${capitalizar(diaSemana(iso))} ${diaMes(iso)}`
const fmtFechaTexto = (iso) => `${diaSemana(iso)} ${diaMes(iso)}`

const hoyISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Colores del gráfico, definidos una sola vez.
const COLOR_GRAFICO = {
  historico: '#2563eb',
  proyeccion: '#dc2626',
  grilla: '#e2e8f0',
  eje: '#334155',
  referencia: '#94a3b8',
  etiqueta: '#475569',
}

const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm'

function KpiCard({ icon: Icon, label, value, sub, tone = 'text-blue-600' }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between text-slate-600">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <div className={`mt-3 text-3xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-600">{sub}</div>
    </div>
  )
}

// Refleja el estado real de cada fuente: en vivo, fallback (valor por defecto) o dato simulado.
function Fuente({ nombre, estado }) {
  const [punto, texto] = {
    en_vivo: ['bg-emerald-600', 'en vivo'],
    simulado: ['bg-amber-500', 'valor por defecto'],
    demo: ['bg-amber-500', 'simulado'],
  }[estado]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${punto}`} />
      {nombre}: {texto}
    </span>
  )
}

// Tick del eje X: nombre completo del dia y debajo la fecha.
function TickDia({ x, y, payload }) {
  const [dia, fecha] = fmtFecha(payload.value).split(' ')
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill={COLOR_GRAFICO.eje} fontSize={12}>
        <tspan x={0} dy={14}>{dia}</tspan>
        <tspan x={0} dy={14}>{fecha}</tspan>
      </text>
    </g>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-md">
      <div className="mb-1 font-semibold">{fmtFecha(label)}</div>
      <div>Altura: {fmtM(p.altura_rio_m)}</div>
      <div>Calado seguro: {fmtFt(p.calado_maximo_seguro_pies)}</div>
      <div className="text-slate-600">{p.tipo === 'prediccion' ? 'Proyección' : 'Histórico'}</div>
    </div>
  )
}

// Encabezado compartido. Sin `fuentes` (pantalla inicial) solo muestra el aviso de datos simulados.
function Encabezado({ ubicacion, fuentes }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-600 p-2">
          <Ship className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Paranax - Calado predictivo y unificado</h1>
          <p className="text-sm text-slate-600">{ubicacion} - agroexportación</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Siempre visible: los días previos, la proyección, el AIS y los costos son simulados. */}
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Datos simulados
        </span>
        {fuentes && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <Fuente nombre="INA (Río)" estado={fuentes.ina} />
            <span aria-hidden="true" className="text-slate-300">|</span>
            <Fuente nombre="BCR (Soja)" estado={fuentes.bcr} />
            <span aria-hidden="true" className="text-slate-300">|</span>
            <Fuente nombre="AIS (Buque)" estado="demo" />
          </div>
        )}
      </div>
    </header>
  )
}

// Primera pantalla: sin IMO no se muestra ningún dato ni número.
function PantallaInicial({ imoInput, setImoInput, onSubmit, vinculando, error }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <Encabezado ubicacion="Gran Rosario - Río Paraná" />
        <section className={`${CARD} mx-auto mt-[12vh] max-w-xl p-8`}>
          <h2 className="text-2xl font-bold text-slate-800">Ingresá el IMO de tu buque</h2>
          <p className="mt-2 text-sm text-slate-600">
            Con el IMO calculamos el calado seguro, las toneladas que no podés cargar por la bajante y cuánto
            cuesta completar la carga en otro puerto.
          </p>
          <form onSubmit={onSubmit} className="mt-6">
            <label htmlFor="imo" className="text-xs font-medium uppercase tracking-wider text-slate-600">
              IMO del buque
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                id="imo"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={7}
                value={imoInput}
                onChange={(e) => setImoInput(e.target.value)}
                placeholder="Ej.: 9436000"
                aria-describedby="imo-ayuda"
                aria-invalid={error ? 'true' : undefined}
                className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="submit"
                disabled={vinculando || !imoInput.trim()}
                className="min-h-11 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
              >
                {vinculando ? 'Consultando…' : 'Consultar buque'}
              </button>
            </div>
            <p id="imo-ayuda" className="mt-2 text-xs text-slate-600">
              El IMO es el número de 7 dígitos que identifica a cada buque.
            </p>
            {error && (
              <p role="alert" className="mt-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  )
}

// Documento de la orden de desvío, dirigido a la agencia marítima. Es un borrador que se actualiza con la
// opción elegida; al emitir la orden pasa a "enviada".
function Linea({ signo, etiqueta, valor, tono = 'text-slate-800', fuerte = false }) {
  const lectura = { '+': 'más', '−': 'menos', '=': 'resultado' }[signo]
  return (
    <div className={`flex items-baseline gap-2 py-1 ${signo === '=' ? 'border-t border-slate-300' : ''}`}>
      <span aria-hidden="true" className={`w-4 text-center font-bold ${tono}`}>{signo}</span>
      <span className="sr-only">{lectura}</span>
      <dt className={`flex-1 ${fuerte ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{etiqueta}</dt>
      <dd className={`text-right ${fuerte ? 'font-bold' : 'font-medium'} ${tono}`}>{valor}</dd>
    </div>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{etiqueta}</dt>
      <dd className="font-medium text-slate-800">{valor}</dd>
    </div>
  )
}

function OrdenDesvio({
  numero,
  emitidaEn,
  buque,
  opcion,
  tnParcial,
  tnCompletar,
  dia,
  pronostico,
  onEmitir,
  onDescargar,
  descargado,
}) {
  const desvia = opcion.id !== 'no-desviar'
  const emitida = emitidaEn !== null
  const anio = emitidaEn ? emitidaEn.getFullYear() : hoyISO().slice(0, 4)
  return (
    <article
      aria-label={desvia ? 'Orden de desvío' : 'Registro de decisión'}
      className={`${CARD} overflow-hidden text-sm`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {desvia ? 'Orden de desvío' : 'Decisión: no desviar'}
          </div>
          {desvia && (
            <div className="text-base font-bold text-slate-800">N.º OD-{anio}-{String(numero).padStart(4, '0')}</div>
          )}
        </div>
        <div className="text-right text-xs text-slate-600">
          {emitida ? (
            <>
              <div>{desvia ? 'Emitida el' : 'Registrada el'}</div>
              <div className="font-medium text-slate-800">
                {emitidaEn.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            </>
          ) : (
            <div className="font-semibold uppercase tracking-wider text-amber-700">Borrador</div>
          )}
        </div>
      </div>

      <div className="space-y-3 px-5 py-3">
        <dl className={`grid gap-x-4 gap-y-1 ${desvia ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {desvia && <Dato etiqueta="Para" valor="Agencia marítima" />}
          <Dato etiqueta="Buque" valor={`${buque.nombre} (${buque.tipo})`} />
          <Dato etiqueta="IMO" valor={buque.imo} />
        </dl>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Instrucción</h3>
          {desvia ? (
            <>
              <p className="mt-0.5 text-slate-800">
                Zarpar de Gran Rosario con carga parcial de <strong>{fmtTn(tnParcial)}</strong> y completar{' '}
                <strong>{fmtTn(tnCompletar)}</strong> en <strong>{opcion.nombre}</strong>.
              </p>
              <p className="mt-0.5 text-slate-600">
                Motivo: bajante del Paraná. Calado seguro previsto de {fmtFt(dia.calado_maximo_seguro_pies)} (altura
                de {fmtM(dia.altura_rio_m)}) el {fmtFechaTexto(dia.fecha)}.
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-slate-800">
              El buque sale de Gran Rosario con la carga que permite el calado (<strong>{fmtTn(tnParcial)}</strong>).
              No se genera orden de desvío.
            </p>
          )}
        </div>

        {desvia && (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Resultado económico estimado
              </h3>
              <span className="text-xs text-slate-600">Costo total del top-off: {fmtUsd(opcion.costo)}</span>
            </div>
            <dl>
              <Linea signo="+" etiqueta="Lucro cesante evitado" valor={fmtUsd(dia.impacto_usd)} tono="text-emerald-700" />
              <Linea
                signo="−"
                etiqueta={`Días extra de buque (${opcion.diasExtra})`}
                valor={fmtUsd(opcion.costoDias)}
                tono="text-red-700"
              />
              <Linea signo="−" etiqueta="Premio del grano" valor={fmtUsd(opcion.costoPremio)} tono="text-red-700" />
              <Linea signo="=" etiqueta="Ahorro neto estimado" valor={fmtUsdConSigno(opcion.ahorroNeto)} fuerte />
            </dl>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Anexo: pronóstico de calado
            </h3>
            <button
              type="button"
              onClick={onDescargar}
              className="-my-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-blue-700 underline-offset-2 hover:underline"
            >
              <Download className="h-4 w-4" /> {descargado ? 'Archivo descargado ✓' : 'Descargar (CSV)'}
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-slate-600">
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-1 pr-2 font-medium">Fecha</th>
                <th scope="col" className="py-1 pr-2 font-medium">Altura</th>
                <th scope="col" className="py-1 pr-2 font-medium">Calado seguro</th>
                <th scope="col" className="py-1 text-right font-medium">Tonelaje rec.</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {pronostico.map((p) => (
                <tr key={p.fecha} className="border-b border-slate-100">
                  <td className="whitespace-nowrap py-1 pr-2">{fmtFecha(p.fecha)}</td>
                  <td className="whitespace-nowrap py-1 pr-2">{fmtM(p.altura_rio_m)}</td>
                  <td className="whitespace-nowrap py-1 pr-2">{fmtFt(p.calado_maximo_seguro_pies)}</td>
                  <td className="whitespace-nowrap py-1 text-right font-medium">{fmtTn(p.tonelaje_recomendado_tn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
        {emitida ? (
          <div role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {desvia ? 'Enviada a la agencia marítima' : 'Decisión registrada'}
          </div>
        ) : (
          <button
            type="button"
            onClick={onEmitir}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Send className="h-4 w-4" /> {desvia ? 'Emitir Orden de Desvío' : 'Registrar decisión: no desviar'}
          </button>
        )}
        <div>Documento generado por Paranax con datos simulados.</div>
      </div>
    </article>
  )
}

export default function App() {
  const [fecha, setFecha] = useState(hoyISO)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [exportado, setExportado] = useState(false)
  const [ordenEmitida, setOrdenEmitida] = useState(false)
  // null = se usa la mejor opción; vuelve a null al cambiar la fecha o el buque.
  const [seleccionId, setSeleccionId] = useState(null)
  const [emitidaEn, setEmitidaEn] = useState(null)

  const [imoInput, setImoInput] = useState('')
  const [buque, setBuque] = useState(null)
  const [buqueError, setBuqueError] = useState(null)
  const [vinculando, setVinculando] = useState(false)

  // Re-consulta ante cambios de fecha o de buque vinculado.
  useEffect(() => {
    if (!buque) return
    let activo = true
    const params = new URLSearchParams({ fecha })
    if (buque) params.set('imo', buque.imo)
    setCargando(true)
    fetch(`${API_BASE}/pronostico-calado?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        if (!activo) return
        setData(d)
        setError(null)
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [fecha, buque])

  function cambiarFecha(nueva) {
    if (!nueva) return
    setFecha(nueva)
    setOrdenEmitida(false)
    setSeleccionId(null)
  }

  async function vincularAis(e) {
    e.preventDefault()
    const imo = imoInput.trim()
    if (!imo) return
    if (!/^\d{7}$/.test(imo)) {
      setBuqueError('El IMO tiene 7 dígitos. Revisá el número e intentá de nuevo.')
      return
    }
    setVinculando(true)
    setBuqueError(null)
    try {
      const r = await fetch(`${API_BASE}/buque/${encodeURIComponent(imo)}`)
      if (r.status === 404) throw new Error('No encontramos un buque con ese IMO. Revisá el número e intentá de nuevo.')
      if (!r.ok) throw new Error('No pudimos consultar el buque. Intentá de nuevo en unos instantes.')
      setBuque(await r.json())
      setOrdenEmitida(false)
      setSeleccionId(null)
    } catch (err) {
      setBuqueError(
        err instanceof TypeError ? 'No pudimos conectar con el servicio. Verificá la conexión e intentá de nuevo.' : err.message,
      )
    } finally {
      setVinculando(false)
    }
  }

  function desvincularAis() {
    setBuque(null)
    setData(null)
    setError(null)
    setImoInput('')
    setBuqueError(null)
    setOrdenEmitida(false)
    setSeleccionId(null)
  }

  const fechaAnalisis = data?.fecha_analisis

  // Dos series con un punto compartido (último histórico) para que las líneas se unan.
  const chartData = useMemo(() => {
    if (!data) return []
    const hayProyeccion = data.serie.some((p) => p.tipo === 'prediccion')
    const ultimoHistorico = data.serie.filter((p) => p.tipo === 'historico').at(-1)?.fecha
    return data.serie.map((p) => ({
      ...p,
      historico: p.tipo === 'historico' ? p.altura_rio_m : null,
      proyeccion:
        hayProyeccion && (p.tipo === 'prediccion' || p.fecha === ultimoHistorico) ? p.altura_rio_m : null,
    }))
  }, [data])

  // Los 3 días posteriores a la fecha de análisis.
  const ventana = data?.serie.filter((p) => p.fecha > fechaAnalisis) ?? []

  function emitirDesvio() {
    setEmitidaEn(new Date())
    setOrdenEmitida(true)
  }

  function exportarReporte() {
    const filas = [
      [
        'Buque',
        'IMO',
        'Fecha',
        'Altura río (m)',
        'Calado máximo seguro (ft)',
        'Tonelaje recomendado (tn)',
        'Impacto económico (USD)',
      ],
      ...ventana.map((p) => [
        data.buque.nombre,
        data.buque.imo,
        p.fecha,
        p.altura_rio_m,
        p.calado_maximo_seguro_pies,
        p.tonelaje_recomendado_tn,
        -p.impacto_usd,
      ]),
    ]
    const csv = filas.map((f) => f.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pronostico-calado-${data.buque.imo}-${fechaAnalisis}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    setExportado(true)
    setTimeout(() => setExportado(false), 3000)
  }

  if (!buque) {
    return (
      <PantallaInicial
        imoInput={imoInput}
        setImoInput={setImoInput}
        onSubmit={vincularAis}
        vinculando={vinculando}
        error={buqueError}
      />
    )
  }

  if (!data && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-700">No se pudo conectar con la API</h1>
          <p className="mt-2 text-sm text-slate-600">
            Verificá que el backend esté corriendo en <code>{API_BASE}</code> ({error}).
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Cargando pronóstico…
      </div>
    )
  }

  const { resumen } = data
  const baja = resumen.tendencia_72hs_m < 0
  const TrendIcon = baja ? ArrowDownRight : ArrowUpRight
  const alturas = data.serie.map((p) => p.altura_rio_m)
  const yMin = Math.floor((Math.min(...alturas) - 0.2) * 10) / 10
  const yMax = Math.ceil((Math.max(...alturas) + 0.2) * 10) / 10

  // Peor día de la ventana de 72 hs: base del top-off.
  const peorDia = ventana.reduce((a, b) => (b.impacto_usd > a.impacto_usd ? b : a))

  // Top-off: reusa el peor día de la ventana (tonelaje no cargado e impacto). "No desviar" es el piso (0).
  const tnTopOff = peorDia.tonelaje_no_cargado_tn
  const opcionesTopOff = [
    ...PUERTOS_TOP_OFF.map((p) => {
      const costoDias = p.diasExtra * COSTO_DIARIO_BUQUE_USD
      const costoPremio = p.premioUsdTn * tnTopOff
      const costo = costoDias + costoPremio
      return { ...p, costoDias, costoPremio, costo, ahorroNeto: peorDia.impacto_usd - costo }
    }),
    { id: 'no-desviar', nombre: 'No desviar', costo: 0, ahorroNeto: 0 },
  ]
  const opcionMejor = opcionesTopOff.reduce((a, b) => (b.ahorroNeto > a.ahorroNeto ? b : a))
  const opcionElegida = opcionesTopOff.find((o) => o.id === seleccionId) ?? opcionMejor
  const ahorroNetoDesvio = opcionElegida.ahorroNeto

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="mx-auto max-w-7xl space-y-5 p-6">
        <Encabezado ubicacion={data.ubicacion} fuentes={data.fuentes} />

        {/* Barra de controles */}
        <section className={`${CARD} flex flex-wrap items-end gap-x-6 gap-y-4 p-4`}>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-600">
              <CalendarDays className="h-4 w-4 text-blue-600" /> Fecha de análisis
            </span>
            <input
              type="date"
              value={fecha}
              max={hoyISO()}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </label>

          <form onSubmit={vincularAis} className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-600">
              <Radar className="h-4 w-4 text-blue-600" /> Buscador de buque (AIS)
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={imoInput}
                onChange={(e) => setImoInput(e.target.value)}
                aria-label="IMO del buque"
                placeholder="Ingresar IMO, ej. 9436000"
                className="min-h-11 w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="submit"
                disabled={vinculando || !imoInput.trim()}
                className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600"
              >
                {vinculando ? 'Buscando…' : 'Vincular AIS'}
              </button>
            </div>
          </form>

          {buque && (
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2">
              <Ship className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-semibold text-slate-800">
                  {buque.nombre} - {buque.tipo}
                </div>
                <div className="text-xs text-slate-600">
                  IMO {buque.imo} · Eslora {buque.eslora_m} m · {fmtTn(buque.carga_optima_tn)} · Calado diseño{' '}
                  {buque.calado_diseno_pies} ft
                </div>
              </div>
              <button
                type="button"
                onClick={desvincularAis}
                                aria-label="Desvincular buque"
                className="flex h-11 w-11 items-center justify-center rounded text-slate-600 transition hover:bg-blue-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {buqueError && <span className="text-sm font-medium text-red-700">{buqueError}</span>}
          {error && <span className="text-sm font-medium text-red-700">Error al actualizar ({error})</span>}
          {cargando && <span className="text-sm text-slate-500">Actualizando…</span>}
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Waves}
            label={data.es_hoy ? 'Altura Actual' : `Altura al ${fmtFechaTexto(fechaAnalisis)}`}
            value={fmtM(data.altura_actual_m)}
            sub="Hidrómetro Rosario"
          />
          <KpiCard
            icon={TrendIcon}
            label="Tendencia a 72hs"
            value={`${resumen.tendencia_72hs_m > 0 ? '+' : ''}${fmtM(resumen.tendencia_72hs_m)}`}
            sub={baja ? 'Bajante en curso' : 'Río en crecida'}
            tone={baja ? 'text-red-700' : 'text-emerald-700'}
          />
          <KpiCard
            icon={TrendingDown}
            label="Pérdida de Capacidad Estimada"
            value={fmtTn(Math.max(0, resumen.perdida_capacidad_tn))}
            sub={`${data.buque.nombre}: carga óptima de ${fmtTn(data.carga_base_tn)}`}
            tone="text-red-700"
          />
          {ordenEmitida ? (
            <KpiCard
              icon={ShieldCheck}
              label="Ahorro Logístico Asegurado"
              value={fmtUsdConSigno(ahorroNetoDesvio)}
              sub={
                opcionElegida.id === 'no-desviar'
                  ? 'Sin desvío: no hay costo ni ahorro de top-off'
                  : `Neto tras el costo del top-off en ${opcionElegida.nombre}`
              }
              tone="text-emerald-700"
            />
          ) : (
            <KpiCard
              icon={DollarSign}
              label="Lucro Cesante (72hs)"
              value={fmtUsdPerdida(resumen.lucro_cesante_72hs_usd)}
              sub={`Soja no cargada a USD ${data.precio_soja_usd_tn}/tn`}
              tone="text-red-700"
            />
          )}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* En pantallas angostas: simulador, orden y despues el grafico. En anchas: grafico y simulador a la
              izquierda, la orden fija a la derecha para verla completa mientras se decide. */}
          <div className="order-3 min-w-0 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <section className={`${CARD} p-5`}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                <Anchor className="h-4 w-4 text-blue-600" /> Altura del río: histórico vs. proyección
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold normal-case tracking-normal text-red-700">
                  Escenario crítico
                </span>
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={COLOR_GRAFICO.grilla} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fecha"
                      tick={<TickDia />}
                      tickFormatter={diaSemana}
                      interval="preserveStartEnd"
                      height={44}
                      stroke={COLOR_GRAFICO.eje}
                    />
                    <YAxis
                      domain={[yMin, yMax]}
                      unit=" m"
                      stroke={COLOR_GRAFICO.eje}
                      fontSize={12}
                      tickFormatter={(v) => fmtDec(v, 1)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine
                      x={fechaAnalisis}
                      stroke={COLOR_GRAFICO.referencia}
                      strokeDasharray="4 4"
                      label={{
                        value: data.es_hoy ? 'Hoy' : 'Fecha de análisis',
                        fill: COLOR_GRAFICO.etiqueta,
                        fontSize: 12,
                        position: 'top',
                      }}
                    />
                    <Line
                      name="Histórico"
                      dataKey="historico"
                      stroke={COLOR_GRAFICO.historico}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Proyección"
                      dataKey="proyeccion"
                      stroke={COLOR_GRAFICO.proyeccion}
                      strokeWidth={3}
                      strokeDasharray="8 5"
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="order-1 min-w-0 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <Route className="h-4 w-4" /> Simulador Top-off
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-emerald-50 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Mejor opción</div>
                  <div className="text-base font-bold text-slate-800">
                    {opcionMejor.id === 'no-desviar' ? 'No desviar' : `Top-off en ${opcionMejor.nombre}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-700">
                    {opcionMejor.id === 'no-desviar' ? 'Sin ahorro' : fmtUsdConSigno(opcionMejor.ahorroNeto)}
                  </div>
                  <div className="text-xs text-emerald-700">
                    {opcionMejor.id === 'no-desviar' ? 'Ningún puerto compensa su costo' : 'de ahorro neto'}
                  </div>
                </div>
              </div>
              <table className="mt-2 w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-600">
                  <tr className="border-b border-blue-200">
                    <th scope="col" className="py-1.5 pr-2">Opción</th>
                    <th scope="col" className="py-1.5 pr-2 text-right">Costo</th>
                    <th scope="col" className="whitespace-nowrap py-1.5 text-right">Ahorro neto</th>
                  </tr>
                </thead>
                <tbody>
                  {opcionesTopOff.map((o) => {
                    const esMejor = o.id === opcionMejor.id
                    const esElegida = o.id === opcionElegida.id
                    return (
                      <tr
                        key={o.id}
                        onClick={() => !ordenEmitida && setSeleccionId(o.id)}
                        className={`border-b border-blue-100 ${ordenEmitida ? '' : 'cursor-pointer'} ${esElegida ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-1 pl-2 pr-2 align-top">
                          <label className="flex min-h-11 items-center gap-2 font-semibold text-slate-800">
                            <input
                              type="radio"
                              name="top-off"
                              className="h-4 w-4 accent-blue-600"
                              checked={esElegida}
                              disabled={ordenEmitida}
                              onChange={() => setSeleccionId(o.id)}
                            />
                            {o.nombre}
                          </label>
                          {esMejor && (
                            <span className="text-xs font-semibold text-emerald-700">Mejor opción</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2 pr-2 text-right align-top font-semibold text-red-700">
                          {o.costo > 0 ? `-${fmtUsd(o.costo)}` : fmtUsd(0)}
                        </td>
                        <td
                          className={`whitespace-nowrap py-2 text-right align-top font-bold ${o.ahorroNeto < 0 ? 'text-red-700' : 'text-emerald-700'}`}
                        >
                          {fmtUsdConSigno(o.ahorroNeto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-600">
                Elegí una opción y emití la orden desde el documento.
              </p>
            </div>
          </div>

          <aside className="order-2 min-w-0 lg:order-none lg:sticky lg:top-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <OrdenDesvio
              numero={NUMERO_ORDEN_DEMO}
              emitidaEn={ordenEmitida ? emitidaEn : null}
              buque={data.buque}
              opcion={opcionElegida}
              tnParcial={peorDia.tonelaje_recomendado_tn}
              tnCompletar={tnTopOff}
              dia={peorDia}
              pronostico={ventana}
              onEmitir={emitirDesvio}
              onDescargar={exportarReporte}
              descargado={exportado}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
