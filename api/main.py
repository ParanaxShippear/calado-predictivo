import math
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Paranax - Gran Rosario")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

METROS_A_PIES = 3.28084

# Modelo de calado: profundidad del canal menos margen bajo quilla (UKC).
OFFSET_CANAL_M = 6.0
UKC_M = 0.6

# Modelo de negocio (referencia Panamax)
CARGA_BASE_PANAMAX_TN = 45_000
PERDIDA_TN_POR_PIE = 2_200  # tn perdidas por pie de calado faltante en un Panamax

# --- Scraping -----------------------------------------------------------------
# Los selectores CSS son placeholders: hay que ajustarlos al HTML real de cada
# sitio. Mientras no coincidan, el scraping falla y se usa el valor de fallback.
ALTURA_FALLBACK_M = 3.49
SOJA_FALLBACK_USD_TN = 400.0
SCRAPE_TIMEOUT_S = 2
CACHE_TTL_S = 300

INA_URL = "https://alerta.ina.gob.ar/pub/gui/Rosario"
INA_SELECTOR = "#altura-actual"
BCR_URL = "https://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales"
BCR_SELECTOR = "#precio-soja-usd"

_cache: dict[str, dict] = {}


def _parse_numero(texto: str) -> float:
    """Extrae el primer número de un texto, aceptando formato es-AR (1.234,56)."""
    m = re.search(r"\d[\d.,]*", texto)
    if not m:
        raise ValueError("sin número")
    s = m.group()
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    return float(s)


def _leer_valor(url: str, selector: str) -> float:
    r = requests.get(url, timeout=SCRAPE_TIMEOUT_S, headers={"User-Agent": "calado-predictivo/0.1"})
    r.raise_for_status()
    nodo = BeautifulSoup(r.text, "html.parser").select_one(selector)
    if nodo is None:
        raise ValueError(f"selector {selector!r} no encontrado")
    return _parse_numero(nodo.get_text())


def _con_cache(clave: str, obtener) -> tuple[float, str]:
    """Cachea también los fallos, para no pagar el timeout en cada request."""
    c = _cache.get(clave)
    if c and time.time() - c["ts"] < CACHE_TTL_S:
        return c["valor"], c["estado"]
    valor, estado = obtener()
    _cache[clave] = {"ts": time.time(), "valor": valor, "estado": estado}
    return valor, estado


def scrapear_altura_rio() -> tuple[float, str]:
    """Altura del río en Rosario (m) desde INA/Prefectura. Fallback: 3.49 m."""

    def obtener():
        try:
            altura = _leer_valor(INA_URL, INA_SELECTOR)
            if not 0.5 <= altura <= 10:
                raise ValueError("altura fuera de rango")
            return altura, "en_vivo"
        except Exception:
            return ALTURA_FALLBACK_M, "simulado"

    return _con_cache("ina", obtener)


def scrapear_precio_soja() -> tuple[float, str]:
    """Precio de la soja (USD/tn) desde la Bolsa de Comercio de Rosario. Fallback: USD 400."""

    def obtener():
        try:
            precio = _leer_valor(BCR_URL, BCR_SELECTOR)
            if not 100 <= precio <= 2_000:
                raise ValueError("precio fuera de rango")
            return precio, "en_vivo"
        except Exception:
            return SOJA_FALLBACK_USD_TN, "simulado"

    return _con_cache("bcr", obtener)


# --- "Base de datos" de buques (AIS simulado) -----------------------------------
BUQUES = {
    "9436000": {
        "imo": "9436000",
        "nombre": "Agro Pioneer",
        "tipo": "Panamax",
        "eslora_m": 225,
        "carga_optima_tn": 45_000,
        "calado_diseno_pies": 34,
    },
    # Buques ficticios para demostrar que el modelo reacciona a la capacidad.
    "9321483": {
        "imo": "9321483",
        "nombre": "Pampa Star",
        "tipo": "Handymax",
        "eslora_m": 190,
        "carga_optima_tn": 32_000,
        "calado_diseno_pies": 30,
    },
    "9512277": {
        "imo": "9512277",
        "nombre": "Gran Chaco",
        "tipo": "Supramax",
        "eslora_m": 200,
        "carga_optima_tn": 55_000,
        "calado_diseno_pies": 36,
    },
}
BUQUE_DEFAULT = BUQUES["9436000"]


def obtener_buque(imo: str) -> dict:
    buque = BUQUES.get(imo.strip())
    if buque is None:
        raise HTTPException(status_code=404, detail=f"IMO {imo} no encontrado")
    return buque


@app.get("/api/buque/{imo}")
def get_buque(imo: str):
    return obtener_buque(imo)


# --- Modelo de calado y tonelaje ------------------------------------------------
def calado_maximo_pies(altura_m: float) -> float:
    return round((altura_m + OFFSET_CANAL_M - UKC_M) * METROS_A_PIES, 2)


def tonelaje_recomendado(calado_pies: float, buque: dict) -> int:
    """Menos altura -> menos calado -> menos toneladas (escala con la capacidad del buque)."""
    perdida_por_pie = PERDIDA_TN_POR_PIE * buque["carga_optima_tn"] / CARGA_BASE_PANAMAX_TN
    pies_faltantes = max(0.0, buque["calado_diseno_pies"] - calado_pies)
    toneladas = buque["carga_optima_tn"] - pies_faltantes * perdida_por_pie
    return int(max(0, round(toneladas, -2)))


DELTAS_PROYECCION_M = {1: -0.06, 2: -0.23, 3: -0.37}  # vs. la altura de hoy


def altura_para(dia: date, hoy: date, altura_hoy: float) -> float:
    """Altura simulada de un día, en torno a la lectura de hoy.

    Pasado: serie acotada que llega a hoy en descenso. Futuro: bajante sostenida.
    """
    off = (dia - hoy).days
    if off == 0:
        return round(altura_hoy, 2)
    if off < 0:
        d = -off
        ruido = random.Random(dia.toordinal()).uniform(-0.03, 0.03)
        altura = altura_hoy + 0.07 * min(d, 4) + 0.5 * math.sin(d / 11) + ruido
    else:
        # Bajante determinística (estable para la demo); luego sigue bajando 0.11 m/día.
        altura = altura_hoy + DELTAS_PROYECCION_M.get(off, DELTAS_PROYECCION_M[3] - 0.11 * (off - 3))
    return round(max(altura, 0.5), 2)


@app.get("/api/pronostico-calado")
def pronostico_calado(fecha: date | None = None, imo: str | None = None):
    hoy = date.today()
    ref = fecha or hoy
    if ref > hoy + timedelta(days=7):
        raise HTTPException(status_code=422, detail="La fecha no puede superar los 7 días a futuro")
    buque = obtener_buque(imo) if imo else BUQUE_DEFAULT

    # En paralelo: si ambas fuentes caen, se paga un solo timeout.
    with ThreadPoolExecutor(max_workers=2) as pool:
        f_altura = pool.submit(scrapear_altura_rio)
        f_soja = pool.submit(scrapear_precio_soja)
        altura_hoy, estado_ina = f_altura.result()
        precio_soja, estado_bcr = f_soja.result()

    # 4 días previos + fecha de análisis + 3 días siguientes. Lo posterior a hoy es proyección.
    serie = []
    for off in range(-4, 4):
        dia = ref + timedelta(days=off)
        altura = altura_para(dia, hoy, altura_hoy)
        calado = calado_maximo_pies(altura)
        tonelaje = tonelaje_recomendado(calado, buque)
        no_cargado = buque["carga_optima_tn"] - tonelaje
        serie.append(
            {
                "fecha": dia.isoformat(),
                "altura_rio_m": altura,
                "calado_maximo_seguro_pies": calado,
                "tonelaje_recomendado_tn": tonelaje,
                "tonelaje_no_cargado_tn": no_cargado,
                "impacto_usd": round(no_cargado * precio_soja),
                "tipo": "historico" if dia <= hoy else "prediccion",
            }
        )

    actual = next(p for p in serie if p["fecha"] == ref.isoformat())
    ventana = [p for p in serie if p["fecha"] > ref.isoformat()]
    return {
        "ubicacion": "Gran Rosario - Río Paraná",
        "fecha_analisis": ref.isoformat(),
        "es_hoy": ref == hoy,
        "es_pasado": ref < hoy,
        "altura_actual_m": actual["altura_rio_m"],
        "carga_base_tn": buque["carga_optima_tn"],
        "precio_soja_usd_tn": precio_soja,
        "buque": buque,
        "fuentes": {"ina": estado_ina, "bcr": estado_bcr},
        "serie": serie,
        "resumen": {
            "tendencia_72hs_m": round(ventana[-1]["altura_rio_m"] - actual["altura_rio_m"], 2),
            "perdida_capacidad_tn": buque["carga_optima_tn"] - ventana[-1]["tonelaje_recomendado_tn"],
            # Un buque se carga una sola vez: el lucro cesante es el del peor día de la ventana, no la suma.
            "lucro_cesante_72hs_usd": max(p["impacto_usd"] for p in ventana),
        },
    }
