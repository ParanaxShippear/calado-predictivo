"""Check the river forecast of a running API against .scratch/pronostico-ina/spec.md (D8, D9).

Usage: python .scratch/pronostico-ina/probar_pronostico.py [base_url]
Default base: http://127.0.0.1:8000/api (on the owner's machine `localhost` adds ~2 s per call).
Exit code 1 on any mismatch.
"""
import json
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8000/api"

# fecha, tipo, altura, min, max, observada, calado, tonelaje, no cargado, impacto
ESPERADO_2021 = [
    ("2021-07-17", "historico", 0.07, None, None, None, 29.92, 36000, 9000, 3600000),
    ("2021-07-18", "historico", 0.03, None, None, None, 29.85, 35900, 9100, 3640000),
    ("2021-07-19", "historico", -0.17, None, None, None, 29.51, 35100, 9900, 3960000),
    ("2021-07-20", "historico", -0.15, None, None, None, 29.55, 35200, 9800, 3920000),
    ("2021-07-21", "historico", -0.14, None, None, None, 29.56, 35200, 9800, 3920000),
    ("2021-07-22", "prediccion", -0.15, -0.24, -0.02, -0.21, 29.55, 35200, 9800, 3920000),
    ("2021-07-23", "prediccion", -0.16, -0.27, 0.05, -0.16, 29.53, 35200, 9800, 3920000),
    ("2021-07-24", "prediccion", -0.16, -0.29, 0.08, -0.15, 29.53, 35200, 9800, 3920000),
]
CAMPOS = (
    "fecha", "tipo", "altura_rio_m", "altura_min_m", "altura_max_m", "altura_observada_m",
    "calado_maximo_seguro_pies", "tonelaje_recomendado_tn", "tonelaje_no_cargado_tn", "impacto_usd",
)
fallas = 0


def pedir(consulta):
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(f"{BASE}/pronostico-calado?{consulta}", timeout=30) as r:
            return r.status, json.load(r), time.perf_counter() - t0
    except urllib.error.HTTPError as e:
        return e.code, json.load(e), time.perf_counter() - t0


def revisar(nombre, obtenido, esperado):
    global fallas
    ok = obtenido == esperado
    fallas += not ok
    print(f"{'OK   ' if ok else 'FALLA'} {nombre}")
    if not ok:
        print(f"      esperado {esperado}\n      obtenido {obtenido}")


# 1. The bajante of July 2021 (spec D9)
estado, d, seg = pedir("fecha=2021-07-21&imo=9436000")
print(f"2021-07-21: HTTP {estado}, fuentes.ina={d.get('fuentes', {}).get('ina')}, {seg:.1f}s")
revisar("proyeccion", d.get("proyeccion"), {"origen": "modelo", "ancla": "2021-07-21"})
revisar("fuente real", d.get("fuentes", {}).get("ina"), "archivo")
for punto, esperado in zip(d.get("serie", []), ESPERADO_2021):
    revisar(f"serie {esperado[0]}", tuple(punto.get(c) for c in CAMPOS), esperado)
revisar("8 puntos", len(d.get("serie", [])), 8)
revisar(
    "resumen",
    d.get("resumen"),
    {"tendencia_72hs_m": -0.02, "perdida_capacidad_tn": 9800, "lucro_cesante_72hs_usd": 3920000},
)

# 2. Other vessels on the same date
for imo, tn, usd in (("9321483", 700, 280000), ("9512277", 17400, 6960000)):
    _, d, _ = pedir(f"fecha=2021-07-21&imo={imo}")
    r = d.get("resumen", {})
    revisar(f"IMO {imo}", (r.get("perdida_capacidad_tn"), r.get("lucro_cesante_72hs_usd")), (tn, usd))

# 3. A high river: no loss
_, d, _ = pedir("fecha=2026-11-10&imo=9436000")
revisar("2026-11-10 ancla", d.get("proyeccion"), {"origen": "modelo", "ancla": "2026-11-10"})
revisar(
    "2026-11-10 sin pérdida",
    [(p["calado_maximo_seguro_pies"], p["tonelaje_no_cargado_tn"]) for p in d.get("serie", [])],
    [(34.0, 0)] * 8,
)

# 4. Gaps in the INA readings: an anchor two days back, and a date with no anchor
_, d, _ = pedir("fecha=2019-08-23&imo=9436000")
revisar("2019-08-23 ancla atrasada", d.get("proyeccion"), {"origen": "modelo", "ancla": "2019-08-21"})
_, d, _ = pedir("fecha=2019-10-10&imo=9436000")
revisar("2019-10-10 simulada", d.get("proyeccion"), {"origen": "simulada", "ancla": None})
revisar("2019-10-10 fuente", d.get("fuentes", {}).get("ina"), "simulado")
revisar(
    "2019-10-10 sin campos del modelo",
    {(p.get("altura_min_m"), p.get("altura_max_m"), p.get("altura_observada_m")) for p in d.get("serie", [])},
    {(None, None, None)},
)

# 5. Date limits
estado, d, _ = pedir("fecha=2099-01-01")
revisar("fecha futura", (estado, d.get("detail")), (422, "La fecha no puede ser posterior a hoy."))
estado, d, _ = pedir("fecha=2019-01-08")
revisar("fecha sin lecturas", (estado, d.get("detail")), (422, "No hay lecturas del INA anteriores al 2019-01-09."))

# 6. Today: reported, not asserted (it depends on the day and on the network)
estado, d, seg = pedir("imo=9436000")
print(
    f"hoy: HTTP {estado}, fuentes.ina={d.get('fuentes', {}).get('ina')}, proyeccion={d.get('proyeccion')}, "
    f"alturas={[p['altura_rio_m'] for p in d.get('serie', [])]}, {seg:.1f}s"
)
revisar("hoy responde", estado, 200)

print(f"fallas={fallas}")
sys.exit(1 if fallas else 0)
