"""Tools for the INA forecast of .scratch/pronostico-ina/spec.md. Standard library only.

  python .scratch/pronostico-ina/ina.py historico [salida]
      Downloads the daily mean heights of Rosario, Diamante and La Paz from DESDE
      to today and writes the snapshot module (default: api/_ina_historico.py).

  python .scratch/pronostico-ina/ina.py ajustar [carpeta_cache]
      Downloads 1990 to today (cached as JSON in the folder; default: the system
      temp directory), fits the model on 1990-2018 and prints the constants and the
      2019+ backtest of spec D5.

  python .scratch/pronostico-ina/ina.py proyectar FECHA [IMO] [modulo_historico]
      Reference implementation of spec D2 and D6 on the snapshot module: prints the
      8-point series the API must return for that analysis date.
"""
import importlib.util
import json
import sys
import tempfile
import urllib.request
from datetime import date, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ESTACIONES = {"ROSARIO": (34, 26276), "DIAMANTE": (31, 26273), "LA_PAZ": (26, 26268)}  # (siteCode, seriesId)
DESDE = date(2019, 1, 1)
LAGS = (1, 3, 7)
HORIZONTES = (1, 2, 3, 4, 5)
ULTIMO_ANIO_AJUSTE = 2018
UMBRAL_AGUAS_BAJAS_M = 1.64

# Spec D5 (fitted by `ajustar`). Order: intercept, then Rosario, Diamante, La Paz, each with lags 1, 3, 7.
COEF = {
    1: (-0.0, 0.1252, -0.0824, -0.0305, -0.009, 0.1037, 0.1062, -0.0179, 0.0439, -0.0096),
    2: (-0.0001, 0.0893, -0.147, -0.0428, -0.0063, 0.1724, 0.1994, -0.007, 0.1182, -0.0154),
    3: (-0.0001, 0.051, -0.1811, -0.0435, 0.0006, 0.1912, 0.2736, 0.0521, 0.2008, -0.0181),
    4: (-0.0002, 0.0419, -0.2179, -0.0315, 0.0011, 0.1892, 0.3299, 0.13, 0.2696, -0.0104),
    5: (-0.0004, 0.0412, -0.2474, -0.0159, -0.0163, 0.199, 0.3708, 0.2294, 0.3199, 0.0007),
}
# Spec D5: P5 and P95 of the fit residuals (m), by regime of the anchor height.
RANGO = {
    "bajo": {1: (-0.09, 0.13), 2: (-0.11, 0.21), 3: (-0.13, 0.24), 4: (-0.19, 0.3), 5: (-0.15, 0.34)},
    "alto": {1: (-0.06, 0.06), 2: (-0.08, 0.09), 3: (-0.1, 0.11), 4: (-0.12, 0.13), 5: (-0.14, 0.15)},
}

# Draft and business model of spec D2 (same numbers as api/main.py after ticket 01).
ALTURA_REFERENCIA_M = 2.47
CALADO_CANAL_PIES = 34.0
PIES_POR_METRO_BAJO_REFERENCIA = 1.7
PERDIDA_TN_POR_PIE = 2_200
CARGA_BASE_PANAMAX_TN = 45_000
SOJA_USD_TN = 400.0
BUQUES = {"9436000": (45_000, 34), "9321483": (32_000, 30), "9512277": (55_000, 36)}


def descargar(nombre, desde, hasta):
    sitio, serie = ESTACIONES[nombre]
    url = (
        "https://alerta.ina.gob.ar/pub/datos/datos"
        f"&timeStart={desde}&timeEnd={hasta}&seriesId={serie}&siteCode={sitio}&varId=39&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "paranax/0.1"})
    with urllib.request.urlopen(req, timeout=120) as r:
        datos = json.load(r).get("data", [])
    return {date.fromisoformat(o["timestart"][:10]): float(o["valor"]) for o in datos if o.get("valor") is not None}


# --- historico -----------------------------------------------------------------
def cmd_historico(salida):
    hoy = date.today()
    series = {n: descargar(n, DESDE, hoy + timedelta(days=1)) for n in ESTACIONES}
    hasta = max(max(s) for s in series.values())
    dias = (hasta - DESDE).days + 1
    lineas = [
        '"""Alturas medias diarias (m) del INA: Rosario, Diamante y La Paz.',
        "",
        "Generado por .scratch/pronostico-ina/ina.py historico. No editar a mano.",
        'Un valor por día desde DESDE; None cuando el INA no publicó lectura."""',
        f'DESDE = "{DESDE}"',
        f'HASTA = "{hasta}"',
    ]
    for n, s in series.items():
        valores = [s.get(DESDE + timedelta(days=i)) for i in range(dias)]
        lineas.append(f"{n} = {valores!r}")
        print(f"{n}: {sum(v is not None for v in valores)} lecturas de {dias} días")
    Path(salida).write_text("\n".join(lineas) + "\n", encoding="utf-8")
    print(f"escrito {salida}: {DESDE} a {hasta}")


# --- ajustar -------------------------------------------------------------------
def cuantil(ordenados, q):
    pos = q * (len(ordenados) - 1)
    i = int(pos)
    j = min(i + 1, len(ordenados) - 1)
    return ordenados[i] + (ordenados[j] - ordenados[i]) * (pos - i)


def resolver(a, b):
    """Gaussian elimination with partial pivoting for the normal equations."""
    n = len(b)
    m = [fila[:] + [b[i]] for i, fila in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        for r in range(c + 1, n):
            f = m[r][c] / m[c][c]
            for k in range(c, n + 1):
                m[r][k] -= f * m[c][k]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (m[r][n] - sum(m[r][k] * x[k] for k in range(r + 1, n))) / m[r][r]
    return x


def variables(series, d):
    """The 9 inputs of spec D5 for anchor day d, or None when a reading is missing."""
    f = []
    for n in ESTACIONES:
        s = series[n]
        if d not in s:
            return None
        for lag in LAGS:
            previo = d - timedelta(days=lag)
            if previo not in s:
                return None
            f.append(s[d] - s[previo])
    return f


def cmd_ajustar(carpeta):
    carpeta = Path(carpeta)
    carpeta.mkdir(parents=True, exist_ok=True)
    series = {}
    for n in ESTACIONES:
        archivo = carpeta / f"{n.lower()}.json"
        if not archivo.exists():
            s = descargar(n, date(1990, 1, 1), date.today() + timedelta(days=1))
            archivo.write_text(json.dumps({str(d): v for d, v in s.items()}), encoding="utf-8")
        series[n] = {date.fromisoformat(d): v for d, v in json.loads(archivo.read_text(encoding="utf-8")).items()}
    ros = series["ROSARIO"]
    print(f"Rosario: {min(ros)} a {max(ros)}, {len(ros)} lecturas")
    coef, rango = {}, {"bajo": {}, "alto": {}}
    for k in HORIZONTES:
        filas = []
        for d in sorted(ros):
            f = variables(series, d)
            if f is not None and d + timedelta(days=k) in ros:
                filas.append((d, [1.0] + f, ros[d + timedelta(days=k)] - ros[d]))
        ajuste = [(x, y) for d, x, y in filas if d.year <= ULTIMO_ANIO_AJUSTE]
        p = len(ajuste[0][0])
        xtx = [[sum(x[i] * x[j] for x, _ in ajuste) for j in range(p)] for i in range(p)]
        xty = [sum(x[i] * y for x, y in ajuste) for i in range(p)]
        coef[k] = tuple(round(c, 4) for c in resolver(xtx, xty))
        res = lambda x, y: y - sum(c * v for c, v in zip(coef[k], x))  # noqa: E731
        for reg, es in (("bajo", lambda d: ros[d] < UMBRAL_AGUAS_BAJAS_M), ("alto", lambda d: ros[d] >= UMBRAL_AGUAS_BAJAS_M)):
            r = sorted(res(x, y) for d, x, y in filas if d.year <= ULTIMO_ANIO_AJUSTE and es(d))
            rango[reg][k] = (round(cuantil(r, 0.05), 2), round(cuantil(r, 0.95), 2))
        prueba = [(d, x, y) for d, x, y in filas if d.year > ULTIMO_ANIO_AJUSTE]
        mae = lambda v: 100 * sum(abs(e) for e in v) / len(v)  # noqa: E731
        dentro = sum(
            rango["bajo" if ros[d] < UMBRAL_AGUAS_BAJAS_M else "alto"][k][0]
            <= res(x, y)
            <= rango["bajo" if ros[d] < UMBRAL_AGUAS_BAJAS_M else "alto"][k][1]
            for d, x, y in prueba
        )
        bajos = [(x, y) for d, x, y in prueba if ros[d] < UMBRAL_AGUAS_BAJAS_M]
        print(
            f"k={k}: ajuste n={len(ajuste)} | prueba n={len(prueba)} "
            f"MAE modelo {mae([res(x, y) for _, x, y in prueba]):.1f} cm, sin cambio {mae([y for _, _, y in prueba]):.1f} cm, "
            f"dentro del rango {100 * dentro / len(prueba):.0f}% | aguas bajas n={len(bajos)} "
            f"MAE modelo {mae([res(x, y) for x, y in bajos]):.1f} cm, sin cambio {mae([y for _, y in bajos]):.1f} cm"
        )
    print("COEF = {")
    for k in HORIZONTES:
        print(f"    {k}: {coef[k]!r},")
    print("}\nRANGO = {")
    for reg in rango:
        print(f'    "{reg}": {{' + ", ".join(f"{k}: {rango[reg][k]!r}" for k in HORIZONTES) + "},")
    print("}")
    print("igual a las constantes de este archivo:", coef == COEF and rango == RANGO)


# --- proyectar (reference implementation of spec D2 and D6) ----------------------
def cargar_historico(ruta):
    spec = importlib.util.spec_from_file_location("ina_historico", ruta)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    desde = date.fromisoformat(mod.DESDE)
    return {
        n: {desde + timedelta(days=i): v for i, v in enumerate(getattr(mod, n)) if v is not None} for n in ESTACIONES
    }


def calado_maximo_pies(altura_m):
    faltante_m = max(0.0, ALTURA_REFERENCIA_M - altura_m)
    return round(CALADO_CANAL_PIES - PIES_POR_METRO_BAJO_REFERENCIA * faltante_m, 2)


def tonelaje_recomendado(calado_pies, carga_optima_tn, calado_diseno_pies):
    perdida_por_pie = PERDIDA_TN_POR_PIE * carga_optima_tn / CARGA_BASE_PANAMAX_TN
    pies_faltantes = max(0.0, calado_diseno_pies - calado_pies)
    return int(max(0, round(carga_optima_tn - pies_faltantes * perdida_por_pie, -2)))


def proyectar(series, ref):
    """Returns (ancla, serie) or None when no anchor exists within 2 days of ref."""
    ros = series["ROSARIO"]
    ancla = next(
        (d for d in (ref - timedelta(days=i) for i in range(3)) if variables(series, d) is not None), None
    )
    if ancla is None:
        return None
    f = [1.0] + variables(series, ancla)
    regimen = "bajo" if ros[ancla] < UMBRAL_AGUAS_BAJAS_M else "alto"
    serie = []
    for off in range(-4, 4):
        dia = ref + timedelta(days=off)
        if dia <= ancla:
            # shortcut: a missing past reading repeats the latest earlier one (rare gaps).
            previo = next(d for d in (dia - timedelta(days=i) for i in range(30)) if d in ros)
            serie.append({"fecha": dia, "tipo": "historico", "altura": round(ros[previo], 2)})
        else:
            k = (dia - ancla).days
            base = ros[ancla] + sum(c * v for c, v in zip(COEF[k], f))
            serie.append(
                {
                    "fecha": dia,
                    "tipo": "prediccion",
                    "altura": round(base, 2),
                    "min": round(base + RANGO[regimen][k][0], 2),
                    "max": round(base + RANGO[regimen][k][1], 2),
                    "observada": ros.get(dia),
                }
            )
    return ancla, serie


def cmd_proyectar(fecha, imo, ruta):
    series = cargar_historico(ruta)
    carga, diseno = BUQUES[imo]
    resultado = proyectar(series, date.fromisoformat(fecha))
    if resultado is None:
        sys.exit("sin ancla: la API usa el escenario simulado")
    ancla, serie = resultado
    print(f"fecha {fecha} IMO {imo} ancla {ancla}")
    for p in serie:
        calado = calado_maximo_pies(p["altura"])
        tn = tonelaje_recomendado(calado, carga, diseno)
        extra = f" rango [{p['min']:.2f}, {p['max']:.2f}] observada {p['observada']}" if p["tipo"] == "prediccion" else ""
        print(
            f"  {p['fecha']} {p['tipo']:<10} altura {p['altura']:.2f} calado {calado:.2f} "
            f"tn {tn} no_cargado {carga - tn} impacto {round((carga - tn) * SOJA_USD_TN)}{extra}"
        )


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["historico"]:
        cmd_historico(args[1] if len(args) > 1 else RAIZ / "api" / "_ina_historico.py")
    elif args[:1] == ["ajustar"]:
        cmd_ajustar(args[1] if len(args) > 1 else Path(tempfile.gettempdir()) / "paranax-ina")
    elif args[:1] == ["proyectar"] and len(args) >= 2:
        cmd_proyectar(args[1], args[2] if len(args) > 2 else "9436000", args[3] if len(args) > 3 else RAIZ / "api" / "_ina_historico.py")
    else:
        sys.exit(__doc__)
