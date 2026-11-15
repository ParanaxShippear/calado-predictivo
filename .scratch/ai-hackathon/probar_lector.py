"""Check the lector de cotizaciones against a running API.

Posts the three sample documents and compares the reading with the expected
results of .scratch/ai-hackathon/spec.md (D9). Prints origin, model, reason,
cita verification and elapsed seconds, so it also measures latency.

Usage: python .scratch/ai-hackathon/probar_lector.py [base_url] [repetitions]
Exit code 1 on any mismatch.
"""
import json
import sys
import time
import urllib.request

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000/api"
VECES = int(sys.argv[2]) if len(sys.argv) > 2 else 1

# (es_cotizacion, costo diario, BB dias, BB premio, Quequén dias, Quequén premio)
ESPERADO = {
    "quequen-agencia": (True, None, None, None, 3, 33),
    "recap-broker": (True, 42500, 5, 36, None, None),
    "no-cotizacion": (False, None, None, None, None, None),
}


def pedir(ruta, cuerpo=None):
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(BASE + ruta, datos, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def valores(lectura):
    p = lectura["puertos"]
    datos = [
        lectura["costo_diario_buque_usd"],
        p["bahia-blanca"]["dias_extra"],
        p["bahia-blanca"]["premio_usd_tn"],
        p["quequen"]["dias_extra"],
        p["quequen"]["premio_usd_tn"],
    ]
    sin_verificar = sum(1 for d in datos if d["valor"] is not None and not d["cita_verificada"])
    return (lectura["es_cotizacion"], *[d["valor"] for d in datos]), sin_verificar


ejemplos = pedir("/cotizaciones-ejemplo")
faltan = set(ESPERADO) - {e["id"] for e in ejemplos}
if faltan:
    sys.exit(f"FALLA: faltan ejemplos {sorted(faltan)}")

fallas = 0
tiempos = []
for vuelta in range(VECES):
    for e in ejemplos:
        t0 = time.perf_counter()
        lectura = pedir("/leer-cotizacion", {"texto": e["texto"]})
        seg = time.perf_counter() - t0
        tiempos.append(seg)
        obtenido, sin_verificar = valores(lectura)
        ok = obtenido == ESPERADO[e["id"]] and sin_verificar == 0
        fallas += not ok
        print(
            f"{'OK   ' if ok else 'FALLA'} {e['id']:<16} origen={lectura['origen']:<10} "
            f"modelo={lectura['modelo']} motivo={lectura['motivo']} "
            f"citas_sin_verificar={sin_verificar} {seg:.1f}s"
        )
        if not ok:
            print(f"      esperado {ESPERADO[e['id']]}\n      obtenido {obtenido}")
        for a in lectura["advertencias"]:
            print(f"      advertencia: {a}")

tiempos.sort()
print(f"llamadas={len(tiempos)} mediana={tiempos[len(tiempos) // 2]:.1f}s max={tiempos[-1]:.1f}s fallas={fallas}")
sys.exit(1 if fallas else 0)
