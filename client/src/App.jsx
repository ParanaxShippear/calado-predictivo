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
const fmtUsd = (n) => `$${n.toLocaleString('en-US')}`
const fmtUsdPerdida = (n) => `-$${Math.abs(n).toLocaleString('en-US')} USD`
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

const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm'

function KpiCard({ icon: Icon, label, value, sub, tone = 'text-blue-600' }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <div className={`mt-3 text-3xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{sub}</div>
    </div>
  )
}

// Refleja el estado real de cada fuente: en vivo, fallback (valor por defecto) o dato de demo.
function Fuente({ nombre, estado }) {
  const info = {
    en_vivo: ['🟢', 'Datos en vivo'],
    simulado: ['🟡', 'Sin respuesta de la fuente: usando valor por defecto'],
    demo: ['🟡', 'Datos simulados (demo)'],
  }[estado]
  return (
    <span title={info[1]} className="inline-flex items-center gap-1.5">
      <span>{info[0]}</span>
      {nombre}
    </span>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-md">
      <div className="mb-1 font-semibold">{fmtFecha(label)}</div>
      <div>Altura: {p.altura_rio_m.toFixed(2)} m</div>
      <div>Calado seguro: {p.calado_maximo_seguro_pies} ft</div>
      <div className="text-slate-500">{p.tipo === 'prediccion' ? 'Proyección' : 'Histórico'}</div>
    </div>
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

  const [imoInput, setImoInput] = useState('')
  const [buque, setBuque] = useState(null)
  const [buqueError, setBuqueError] = useState(null)
  const [vinculando, setVinculando] = useState(false)

  // Re-consulta ante cambios de fecha o de buque vinculado.
  useEffect(() => {
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
    setVinculando(true)
    setBuqueError(null)
    try {
      const r = await fetch(`${API_BASE}/buque/${encodeURIComponent(imo)}`)
      if (r.status === 404) throw new Error('IMO no encontrado')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setBuque(await r.json())
      setOrdenEmitida(false)
      setSeleccionId(null)
    } catch (err) {
      setBuque(null)
      setBuqueError(err.message)
    } finally {
      setVinculando(false)
    }
  }

  function desvincularAis() {
    setBuque(null)
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
    setOrdenEmitida(true)
  }

  function exportarReporte() {
    const filas = [
      [
        'Fecha',
        'Altura río (m)',
        'Calado máximo seguro (ft)',
        'Tonelaje recomendado (tn)',
        'Impacto económico (USD)',
      ],
      ...ventana.map((p) => [
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
    a.download = `reporte-calado-${fechaAnalisis}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    setExportado(true)
    setTimeout(() => setExportado(false), 3000)
  }

  if (!data && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-600">No se pudo conectar con la API</h1>
          <p className="mt-2 text-sm text-slate-600">
            Verificá que el backend esté corriendo en <code>{API_BASE}</code> ({error}).
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
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
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Ship className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Calado Predictivo · Command Center</h1>
              <p className="text-sm text-slate-500">{data.ubicacion} — agroexportación</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Siempre visible: los días previos, la proyección, el AIS y los costos son demo. */}
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
              Datos de demo
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <Fuente nombre="INA (Río)" estado={data.fuentes.ina} />
              <span className="text-slate-300">|</span>
              <Fuente nombre="BCR (Soja)" estado={data.fuentes.bcr} />
              <span className="text-slate-300">|</span>
              <Fuente nombre="AIS (Buque)" estado="demo" />
            </div>
          </div>
        </header>

        {/* Barra de controles */}
        <section className={`${CARD} flex flex-wrap items-end gap-x-6 gap-y-4 p-4`}>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              <CalendarDays className="h-4 w-4 text-blue-600" /> Fecha de análisis
            </span>
            <input
              type="date"
              value={fecha}
              max={hoyISO()}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </label>

          <form onSubmit={vincularAis} className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              <Radar className="h-4 w-4 text-blue-600" /> Buscador de buque (AIS)
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={imoInput}
                onChange={(e) => setImoInput(e.target.value)}
                placeholder="Ingresar IMO, ej. 9436000"
                className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="submit"
                disabled={vinculando || !imoInput.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
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
                <div className="text-xs text-slate-500">
                  IMO {buque.imo} · Eslora {buque.eslora_m} m · {fmtTn(buque.carga_optima_tn)} · Calado diseño{' '}
                  {buque.calado_diseno_pies} ft
                </div>
              </div>
              <button
                type="button"
                onClick={desvincularAis}
                title="Desvincular buque"
                className="rounded p-1 text-slate-400 transition hover:bg-blue-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {buqueError && <span className="text-sm font-medium text-red-600">{buqueError}</span>}
          {error && <span className="text-sm font-medium text-red-600">Error al actualizar ({error})</span>}
          {cargando && <span className="text-sm text-slate-400">Actualizando…</span>}
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Waves}
            label={data.es_hoy ? 'Altura Actual' : `Altura al ${fmtDiaCorto(fechaAnalisis)}`}
            value={`${data.altura_actual_m.toFixed(2)} m`}
            sub="Hidrómetro Rosario"
          />
          <KpiCard
            icon={TrendIcon}
            label="Tendencia a 72hs"
            value={`${resumen.tendencia_72hs_m > 0 ? '+' : ''}${resumen.tendencia_72hs_m.toFixed(2)} m`}
            sub={baja ? 'Bajante en curso' : 'Río en crecida'}
            tone={baja ? 'text-red-600' : 'text-emerald-600'}
          />
          <KpiCard
            icon={TrendingDown}
            label="Pérdida de Capacidad Estimada"
            value={fmtTn(Math.max(0, resumen.perdida_capacidad_tn))}
            sub={`${data.buque.nombre}: carga óptima de ${fmtTn(data.carga_base_tn)}`}
            tone="text-red-600"
          />
          {ordenEmitida ? (
            <KpiCard
              icon={ShieldCheck}
              label="Ahorro Logístico Asegurado"
              value={`${fmtUsdConSigno(ahorroNetoDesvio)} USD`}
              sub={`Neto tras el costo del top-off en ${opcionElegida.nombre}`}
              tone="text-emerald-600"
            />
          ) : (
            <KpiCard
              icon={DollarSign}
              label="Lucro Cesante (72hs)"
              value={fmtUsdPerdida(resumen.lucro_cesante_72hs_usd)}
              sub={`Soja no cargada a USD ${data.precio_soja_usd_tn}/tn`}
              tone="text-red-600"
            />
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-10">
          {/* Columna izquierda (70%): gráfico + tabla */}
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
            <section className={`${CARD} p-5`}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Anchor className="h-4 w-4 text-blue-600" /> Línea de flotación: histórico vs. proyección
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold normal-case tracking-normal text-red-600">
                  Escenario crítico
                </span>
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" tickFormatter={fmtFecha} stroke="#334155" fontSize={12} />
                    <YAxis
                      domain={[yMin, yMax]}
                      unit=" m"
                      stroke="#334155"
                      fontSize={12}
                      tickFormatter={(v) => v.toFixed(1)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine
                      x={fechaAnalisis}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: data.es_hoy ? 'Hoy' : 'Fecha de análisis',
                        fill: '#475569',
                        fontSize: 12,
                        position: 'top',
                      }}
                    />
                    <Line
                      name="Histórico"
                      dataKey="historico"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Proyección"
                      dataKey="proyeccion"
                      stroke="#dc2626"
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
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  {data.es_pasado
                    ? 'Recomendación de carga · 3 días siguientes'
                    : 'Recomendación de carga · próximos 3 días'}
                </h2>
                <button
                  onClick={exportarReporte}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  {exportado ? 'Reporte generado ✓' : 'Exportar reporte a agencia marítima'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-2 pr-4">Fecha</th>
                      <th className="py-2 pr-4">Altura del río</th>
                      <th className="py-2 pr-4">Calado máx. seguro</th>
                      <th className="py-2 pr-4">Tonelaje recomendado</th>
                      <th className="py-2">Impacto económico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventana.map((p) => (
                      <tr key={p.fecha} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium capitalize">{fmtFecha(p.fecha)}</td>
                        <td className="py-3 pr-4">{p.altura_rio_m.toFixed(2)} m</td>
                        <td className="py-3 pr-4">{p.calado_maximo_seguro_pies} ft</td>
                        <td className="py-3 pr-4 font-semibold">{fmtTn(p.tonelaje_recomendado_tn)}</td>
                        <td className="py-3 font-semibold text-red-600">{fmtUsdPerdida(p.impacto_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Columna derecha (30%): Centro de Decisiones */}
          <aside className="flex min-w-0 flex-col gap-4 lg:col-span-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              <Target className="h-4 w-4 text-blue-600" /> Centro de Decisiones
            </h2>

            {ordenEmitida && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-sm"
              >
                ✅ Orden #{NUMERO_ORDEN_DEMO} emitida: el buque se desvía al sur para completar la carga en{' '}
                {opcionElegida.nombre}.
              </div>
            )}

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Arbitraje Logístico
              </div>
              <p className="mt-2 text-lg font-bold text-slate-800">
                💡 Adelantar zarpe al {fmtDiaCorto(mejorDia.fecha)}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                + {fmtUsd(ahorroArbitraje)} USD de ahorro frente al {fmtDiaSemana(peorDia.fecha)}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <Route className="h-4 w-4" /> Simulador Top-off
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                El buque carga parcialmente en el Gran Rosario y navega al sur para completar{' '}
                {fmtTn(tnTopOff)} en el puerto elegido.
              </p>
              <table className="mt-3 w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-blue-200">
                    <th className="py-1.5 pr-2">Opción</th>
                    <th className="py-1.5 pr-2 text-right">Costo</th>
                    <th className="py-1.5 text-right">Ahorro neto</th>
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
                        className={`border-b border-blue-100 ${ordenEmitida ? '' : 'cursor-pointer'} ${esElegida ? 'bg-blue-100' : ''}`}
                      >
                        <td className="py-2 pr-2 align-top">
                          <label className="flex items-center gap-2 font-semibold text-slate-800">
                            <input
                              type="radio"
                              name="top-off"
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
                            <div className="text-xs text-slate-500">
                              Días extra {fmtUsd(o.costoDias)} · Premio del grano {fmtUsd(o.costoPremio)}
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-right align-top font-semibold text-red-600">
                          {o.costo > 0 ? `-${fmtUsd(o.costo)}` : fmtUsd(0)}
                        </td>
                        <td
                          className={`py-2 text-right align-top font-bold ${o.ahorroNeto < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                        >
                          {fmtUsdConSigno(o.ahorroNeto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-500">
                <li>Costo = días extra de buque (USD {COSTO_DIARIO_BUQUE_USD.toLocaleString('en-US')} por día, demo) + premio del grano por tonelada completada.</li>
                {PUERTOS_TOP_OFF.map((p) => (
                  <li key={p.id}>
                    {p.nombre}: {p.diasExtra} días extra (demo) y USD {p.premioUsdTn}/tn de premio del grano (
                    {p.premioEsReferencia
                      ? 'referencia: dentro del diferencial del maíz que observó Sio Granos sobre Gran Rosario, unos USD 32 a 40/tn en 2021 y 2022'
                      : 'demo'}
                    ).
                  </li>
                ))}
                <li>Toneladas a completar y beneficio: las del peor día de la ventana de 72 hs.</li>
                <li>Modelo: 2.200 tn perdidas por pie de calado faltante.</li>
                <li>Panamax de referencia, 45.000 tn (supuesto del modelo; la BCR cita Panamax de 60.000 a 65.000 tn).</li>
                <li>Calado de diseño del Panamax (supuesto): 34 ft; pies faltantes = 34 − calado seguro.</li>
              </ul>
              <button
                onClick={emitirDesvio}
                disabled={ordenEmitida || opcionElegida.id === 'no-desviar'}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
              >
                {ordenEmitida ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Orden Ejecutada
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Emitir Orden de Desvío
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
