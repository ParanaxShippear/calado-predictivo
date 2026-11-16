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
from pydantic import BaseModel

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


# --- Lector de cotizaciones -------------------------------------------------------
COTIZACION_MAX_CHARS = 8_000

# Rango válido de cada valor (S6): (mínimo, máximo, el mínimo es válido).
RANGOS = {
    "dias_extra": (0, 30, False),
    "premio_usd_tn": (0, 200, True),
    "costo_diario_buque_usd": (5_000, 200_000, True),
}

_NULO = {"valor": None, "cita": None}
_PUERTO_NULO = {"dias_extra": _NULO, "premio_usd_tn": _NULO}

# DEMO: documentos de ejemplo ficticios y su lectura precargada.
COTIZACIONES_EJEMPLO = [
    {
        "id": "quequen-agencia",
        "titulo": "Cotización de agencia: Quequén",
        "texto": """De: Operaciones, Agencia Marítima del Sur (ejemplo ficticio)
Asunto: MV Agro Pioneer - alternativa de completamiento en Quequén

Estimados:

Ante la bajante del Paraná, les pasamos la alternativa de completar la carga en Quequén.

Hay giro disponible para la semana próxima. Entre la navegación, la espera de muelle y la carga, estimamos 3 días adicionales de buque respecto de la salida directa desde Gran Rosario.

Según la mesa de granos, la mercadería puesta en Quequén se consigue hoy con un premio de USD 33 por tonelada sobre Gran Rosario.

Quedamos a disposición.
Saludos,
Operaciones""",
        "lectura": {
            "es_cotizacion": True,
            "costo_diario_buque_usd": _NULO,
            "bahia_blanca": _PUERTO_NULO,
            "quequen": {
                "dias_extra": {"valor": 3, "cita": "estimamos 3 días adicionales de buque"},
                "premio_usd_tn": {
                    "valor": 33,
                    "cita": "un premio de USD 33 por tonelada sobre Gran Rosario",
                },
            },
        },
    },
    {
        "id": "recap-broker",
        "titulo": "Recap del broker: costo diario y Bahía Blanca",
        "texto": """De: Mesa de fletes, Broker Río de la Plata (ejemplo ficticio)
Asunto: MV Agro Pioneer - recap de condiciones para top-off

Confirmamos con el armador las condiciones para el completamiento:

- Costo diario del buque: USD 42.500 por día, aplicable a todos los días adicionales.
- Bahía Blanca: 2 días de navegación adicional, 1,5 días de espera de turno y 1,5 días de carga.
- Premio del grano en Bahía Blanca: USD 36 por tonelada sobre Gran Rosario, según el cierre de ayer.

Quequén no fue cotizado en esta ronda.""",
        "lectura": {
            "es_cotizacion": True,
            "costo_diario_buque_usd": {"valor": 42_500, "cita": "Costo diario del buque: USD 42.500 por día"},
            "bahia_blanca": {
                "dias_extra": {
                    "valor": 5,
                    "cita": "2 días de navegación adicional, 1,5 días de espera de turno y 1,5 días de carga",
                },
                "premio_usd_tn": {"valor": 36, "cita": "USD 36 por tonelada sobre Gran Rosario"},
            },
            "quequen": _PUERTO_NULO,
        },
    },
    {
        "id": "no-cotizacion",
        "titulo": "Documento que no es una cotización",
        "texto": """De: Administración (ejemplo ficticio)
Asunto: Recordatorio - vencimiento de facturas de octubre

Les recordamos que el viernes vence el plazo para presentar las facturas de servicios de octubre. Las que lleguen después de esa fecha pasan al cierre de noviembre.

Gracias.""",
        "lectura": {
            "es_cotizacion": False,
            "costo_diario_buque_usd": _NULO,
            "bahia_blanca": _PUERTO_NULO,
            "quequen": _PUERTO_NULO,
        },
    },
]

LECTURA_VACIA = {
    "es_cotizacion": False,
    "costo_diario_buque_usd": _NULO,
    "bahia_blanca": _PUERTO_NULO,
    "quequen": _PUERTO_NULO,
}


def _normalizar(texto: str) -> str:
    return " ".join(texto.split()).casefold()


def _verificar_dato(dato: dict, campo: str, texto_norm: str, advertencias: list[str]) -> dict:
    """Aplica el rango del campo y verifica que la cita esté literal en el documento (S6)."""
    valor, cita = dato.get("valor"), dato.get("cita")
    minimo, maximo, incluye_min = RANGOS[campo]
    if valor is not None and not ((valor >= minimo if incluye_min else valor > minimo) and valor <= maximo):
        advertencias.append(f"Valor fuera de rango descartado: {campo}.")
        valor = cita = None
    return {"valor": valor, "cita": cita, "cita_verificada": bool(cita) and _normalizar(cita) in texto_norm}


def armar_lectura(origen: str, modelo: str | None, motivo: str | None, crudo: dict, texto: str) -> dict:
    """Única salida de una lectura, del modelo o precargada: pasa siempre por los mismos controles."""
    norm = _normalizar(texto)
    advertencias = list(crudo.get("advertencias", []))
    puertos = {
        id_puerto: {
            c: _verificar_dato(crudo[clave][c], c, norm, advertencias) for c in ("dias_extra", "premio_usd_tn")
        }
        for id_puerto, clave in (("bahia-blanca", "bahia_blanca"), ("quequen", "quequen"))
    }
    return {
        "origen": origen,
        "modelo": modelo if origen == "ia" else None,
        "motivo": None if origen == "ia" else motivo,
        "es_cotizacion": crudo["es_cotizacion"],
        "costo_diario_buque_usd": _verificar_dato(
            crudo["costo_diario_buque_usd"], "costo_diario_buque_usd", norm, advertencias
        ),
        "puertos": puertos,
        "advertencias": advertencias,
    }


def _leer_sin_ia(texto: str, motivo: str) -> dict:
    """Fallback determinístico (S5): lectura precargada si el texto es un ejemplo; si no, valores vacíos."""
    norm = _normalizar(texto)
    ejemplo = next((e for e in COTIZACIONES_EJEMPLO if _normalizar(e["texto"]) == norm), None)
    if ejemplo:
        return armar_lectura("precargado", None, motivo, ejemplo["lectura"], texto)
    return armar_lectura("sin_ia", None, motivo, LECTURA_VACIA, texto)


class CotizacionEntrada(BaseModel):
    texto: str


@app.get("/api/cotizaciones-ejemplo")
def get_cotizaciones_ejemplo():
    return [{k: e[k] for k in ("id", "titulo", "texto")} for e in COTIZACIONES_EJEMPLO]


@app.post("/api/leer-cotizacion")
def leer_cotizacion(entrada: CotizacionEntrada):
    texto = entrada.texto
    if not texto.strip():
        raise HTTPException(status_code=422, detail="El documento está vacío.")
    if len(texto) > COTIZACION_MAX_CHARS:
        raise HTTPException(status_code=422, detail="El documento supera los 8.000 caracteres.")
    return _leer_sin_ia(texto, "sin_sdk")
