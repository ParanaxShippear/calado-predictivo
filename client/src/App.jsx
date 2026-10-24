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
  Lightbulb,
  Radar,
  Route,
  Ruler,
  Send,
  ShieldCheck,
  Ship,
  Target,
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
const fmtFecha = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
const fmtDiaCorto = (iso) => {
  const s = new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '')
}
const fmtDiaSemana = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long' })

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

// Documento de la orden de desvío, dirigido a la agencia marítima. Se muestra al emitir la orden.
function OrdenDesvio({ numero, emitidaEn, buque, opcion, tnParcial, tnCompletar, dia, pronostico, onDescargar }) {
  const fila = (etiqueta, valor, fuerte = false) => (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-slate-600">{etiqueta}</dt>
      <dd className={`text-right ${fuerte ? 'font-bold text-slate-800' : 'font-medium text-slate-800'}`}>{valor}</dd>
    </div>
  )
  return (
    <article aria-label="Orden de desvío" className={`${CARD} overflow-hidden text-sm`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Orden de desvío</div>
          <div className="mt-0.5 text-base font-bold text-slate-800">
            N.º OD-{emitidaEn.getFullYear()}-{String(numero).padStart(4, '0')}
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <div>Emitida el</div>
          <div className="font-medium text-slate-800">
            {emitidaEn.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <dl className="divide-y divide-slate-100">
          {fila('Para', 'Agencia marítima')}
          {fila('Buque', `${buque.nombre} (${buque.tipo})`)}
          {fila('IMO', buque.imo)}
        </dl>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Instrucción</h3>
          <p className="mt-1 text-slate-800">
            Zarpar de Gran Rosario con carga parcial de <strong>{fmtTn(tnParcial)}</strong> y completar{' '}
            <strong>{fmtTn(tnCompletar)}</strong> en <strong>{opcion.nombre}</strong>.
          </p>
          <p className="mt-1 text-slate-600">
            Motivo: bajante del Paraná. Calado seguro previsto de {fmtFt(dia.calado_maximo_seguro_pies)} (altura de{' '}
            {fmtM(dia.altura_rio_m)}) al {fmtFecha(dia.fecha)}.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Costo estimado del top-off</h3>
          <dl className="mt-1 divide-y divide-slate-100">
            {fila(`Días extra de buque (${opcion.diasExtra})`, fmtUsd(opcion.costoDias))}
            {fila('Premio del grano', fmtUsd(opcion.costoPremio))}
            {fila('Costo total', fmtUsd(opcion.costo))}
            {fila('Ahorro neto estimado', fmtUsdConSigno(opcion.ahorroNeto), true)}
          </dl>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Anexo: pronóstico de calado
          </h3>
          <table className="mt-1 w-full text-left text-xs">
            <thead className="text-slate-600">
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-1.5 pr-2 font-medium">Fecha</th>
                <th scope="col" className="py-1.5 pr-2 font-medium">Altura</th>
                <th scope="col" className="py-1.5 pr-2 font-medium">Calado seguro</th>
                <th scope="col" className="py-1.5 text-right font-medium">Tonelaje rec.</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {pronostico.map((p) => (
                <tr key={p.fecha} className="border-b border-slate-100">
                  <td className="whitespace-nowrap py-1.5 pr-2 capitalize">{fmtFecha(p.fecha)}</td>
                  <td className="whitespace-nowrap py-1.5 pr-2">{fmtM(p.altura_rio_m)}</td>
                  <td className="whitespace-nowrap py-1.5 pr-2">{fmtFt(p.calado_maximo_seguro_pies)}</td>
                  <td className="whitespace-nowrap py-1.5 text-right font-medium">{fmtTn(p.tonelaje_recomendado_tn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={onDescargar}
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
          >
            <Download className="h-4 w-4" /> Descargar anexo (CSV)
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
        <div className="font-semibold text-slate-800">Estado: enviada a la agencia marítima</div>
        <div className="mt-0.5">Documento generado por Paranax con datos simulados.</div>
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

  // Mitigación: mejor/peor día de la ventana.
  const mejorDia = ventana.reduce((a, b) => (b.impacto_usd < a.impacto_usd ? b : a))
  const peorDia = ventana.reduce((a, b) => (b.impacto_usd > a.impacto_usd ? b : a))
  const ahorroArbitraje = peorDia.impacto_usd - mejorDia.impacto_usd

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
      <main className="mx-auto max-w-7xl space-y-6 p-6">
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
            label={data.es_hoy ? 'Altura Actual' : `Altura al ${fmtDiaCorto(fechaAnalisis)}`}
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

        <div className="grid gap-6 lg:grid-cols-10">
          {/* Columna izquierda: gráfico + tabla */}
          <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1 lg:col-span-6">
            <section className={`${CARD} p-5`}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                <Anchor className="h-4 w-4 text-blue-600" /> Altura del río: histórico vs. proyección
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold normal-case tracking-normal text-red-700">
                  Escenario crítico
                </span>
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={COLOR_GRAFICO.grilla} strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" tickFormatter={fmtFecha} stroke={COLOR_GRAFICO.eje} fontSize={12} />
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

            <section className={`${CARD} p-5`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  {data.es_pasado
                    ? 'Recomendación de carga · 3 días siguientes'
                    : 'Recomendación de carga · próximos 3 días'}
                </h2>
                <button
                  onClick={exportarReporte}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  {exportado ? 'Archivo descargado ✓' : 'Descargar pronóstico (CSV)'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th scope="col" className="py-2 pr-4">Fecha</th>
                      <th scope="col" className="py-2 pr-4">Altura del río</th>
                      <th scope="col" className="py-2 pr-4">Calado máx. seguro</th>
                      <th scope="col" className="py-2 pr-4">Tonelaje recomendado</th>
                      <th scope="col" className="py-2">Impacto económico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventana.map((p) => (
                      <tr key={p.fecha} className="border-b border-slate-100">
                        <td className="whitespace-nowrap py-3 pr-4 font-medium capitalize">{fmtFecha(p.fecha)}</td>
                        <td className="py-3 pr-4">{fmtM(p.altura_rio_m)}</td>
                        <td className="py-3 pr-4">{fmtFt(p.calado_maximo_seguro_pies)}</td>
                        <td className="py-3 pr-4 font-semibold">{fmtTn(p.tonelaje_recomendado_tn)}</td>
                        <td className="py-3 font-semibold text-red-700">{fmtUsdPerdida(p.impacto_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Columna derecha: Centro de Decisiones (primero en pantallas angostas) */}
          <aside className="order-1 flex min-w-0 flex-col gap-4 lg:order-2 lg:col-span-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
              <Target className="h-4 w-4 text-blue-600" /> Centro de Decisiones
            </h2>

            {ordenEmitida && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  {opcionElegida.id === 'no-desviar'
                    ? 'Decisión registrada: no desviar. El buque sale con la carga que permite el calado.'
                    : `Orden #${NUMERO_ORDEN_DEMO} emitida: el buque se desvía al sur para completar la carga en ${opcionElegida.nombre}.`}
                </span>
              </div>
            )}

            {ordenEmitida && opcionElegida.id !== 'no-desviar' && emitidaEn && (
              <OrdenDesvio
                numero={NUMERO_ORDEN_DEMO}
                emitidaEn={emitidaEn}
                buque={data.buque}
                opcion={opcionElegida}
                tnParcial={peorDia.tonelaje_recomendado_tn}
                tnCompletar={tnTopOff}
                dia={peorDia}
                pronostico={ventana}
                onDescargar={exportarReporte}
              />
            )}

            <div className={`${CARD} p-5`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <Route className="h-4 w-4" /> Simulador Top-off
              </div>
              <div className="mt-3 rounded-lg bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Mejor opción</div>
                <div className="mt-1 text-xl font-bold text-slate-800">
                  {opcionMejor.id === 'no-desviar' ? 'No desviar' : `Top-off en ${opcionMejor.nombre}`}
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">
                  {opcionMejor.id === 'no-desviar' ? 'Sin ahorro' : fmtUsdConSigno(opcionMejor.ahorroNeto)}
                </div>
                <div className="text-sm text-emerald-700">
                  {opcionMejor.id === 'no-desviar' ? 'Ningún puerto compensa su costo' : 'de ahorro neto'}
                </div>
              </div>
              <table className="mt-4 w-full text-left text-sm">
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
                          {o.costo > 0 && (
                            <div className="text-xs text-slate-600">
                              Días extra {fmtUsd(o.costoDias)} · Premio del grano {fmtUsd(o.costoPremio)}
                            </div>
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
              <button
                onClick={emitirDesvio}
                disabled={ordenEmitida}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none"
              >
                {ordenEmitida ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />{' '}
                    {opcionElegida.id === 'no-desviar' ? 'Decisión registrada' : 'Orden Ejecutada'}
                  </>
                ) : opcionElegida.id === 'no-desviar' ? (
                  <>
                    <Send className="h-4 w-4" /> Registrar decisión: no desviar
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Emitir Orden de Desvío
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Arbitraje Logístico
              </div>
              <p className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Lightbulb className="h-5 w-5 shrink-0 text-blue-600" /> Adelantar zarpe al {fmtDiaCorto(mejorDia.fecha)}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                + {fmtUsd(ahorroArbitraje)} de ahorro frente al {fmtDiaSemana(peorDia.fecha)}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
