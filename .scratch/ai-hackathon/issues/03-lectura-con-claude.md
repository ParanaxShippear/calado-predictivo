# 03: Lectura con Claude

**What to build:** `POST /api/leer-cotizacion` calls Claude when it can, with the request pinned in the spec, and keeps the fallback of ticket 01 for every failure. The fixed `motivo: "sin_sdk"` of ticket 01 is replaced by the real reason. Nothing changes in the frontend: the origin label and the model name are already rendered by ticket 02.

**Blocked by:** 01: Endpoint de lectura con respuestas precargadas. (02 is needed only for the UI steps.)

**Status:** ready-for-agent

Spec: `.scratch/ai-hackathon/spec.md` (S4, S5, S6, S7, S8; D1 to D6, D12)

**Files:** `api/requirements.txt`, `api/main.py`, `README.md`

Before starting: the owner sets `ANTHROPIC_API_KEY` in the shell that runs uvicorn. The model of spec D1 was confirmed on 2026-11-15. The agent never reads, prints or writes the key.

- [ ] `api/requirements.txt` gains the line `anthropic>=2.8,<3`. No other dependency.
- [ ] `import anthropic` sits inside `try / except ImportError` at module top and sets `anthropic = None` on failure. With the package uninstalled, the API starts and the existing endpoints answer.
- [ ] The constants, the client and the call are exactly those of spec D2. `PROMPT_LECTOR` is the text of spec D5, verbatim. `ESQUEMA_LECTURA` follows spec D5, with no `$ref`.
- [ ] The response is read as in spec D3: branch on `stop_reason` first, take the first `text` block, `json.loads` it, map the model's `bahia_blanca` and `quequen` keys to the `puertos` keys of spec D7.
- [ ] The fallback reasons of spec D4 are checked in that order, with `anthropic.APITimeoutError` caught before `anthropic.APIConnectionError`. Each reason is logged with `logging`; the key and the document text are never logged.
- [ ] A reading from Claude goes through the same check function as the stored ones (ranges and cita verification).
- [ ] With a successful call, `origen` is `ia`, `modelo` is `respuesta.model` and `motivo` is null.
- [ ] `README.md`: "Ejecución" explains how to set `ANTHROPIC_API_KEY` in the shell (PowerShell and bash, one line each) and that without it the lector answers with stored readings; "Stack" names the `anthropic` SDK; the bullet added in ticket 02 no longer says the readings are only the stored ones.

Stop and report to the owner instead of working around it if the first real call returns a 400. Quote the error message. A 400 that names `fallbacks` or the beta header means the account does not have the server-side fallback beta.

## Verification

Without a key (unset the variable in that shell first):

```bash
cd api && pip install -r requirements.txt && uvicorn main:app --port 8000
```

```bash
python .scratch/ai-hackathon/probar_lector.py
```

Expected: three `OK` lines, `origen=precargado`, `motivo=sin_clave`, `fallas=0`.

With the key set by the owner in the uvicorn shell, restart uvicorn and run:

```bash
python .scratch/ai-hackathon/probar_lector.py http://localhost:8000/api 3
```

Expected: nine `OK` lines with `origen=ia` and `modelo=claude-sonnet-5-5`, `citas_sin_verificar=0`, `fallas=0`. Record the printed `mediana` and `max` in this file under a `## Resultados observados` heading. A `FALLA` line is a finding: paste the expected and obtained values there and report it; do not edit the expected values to match.

Timeout path: set `IA_TIMEOUT_S = 0.001` temporarily, restart, run the script once. Expected: `origen=precargado`, `motivo=timeout`. Restore `10.0` before committing.

SDK-missing path, only if a throwaway virtual environment is at hand: without `anthropic` installed the script reports `motivo=sin_sdk` and `curl localhost:8000/api/pronostico-calado` still answers. Otherwise review the import guard by reading it and say this path was not run.

Secrets:

```bash
git grep -n "sk-ant" -- . ; git status --short
```

Expected: no match, and no `.env` file among the changes.

UI (with ticket 02 in place and the key set): read the sample "Cotización de agencia: Quequén". The label reads "Leído por IA (modelo claude-sonnet-5-5). Revisá cada valor antes de aplicarlo." and applying it gives the numbers of spec D9. Golden path through the CSV download still works.

## Resultados observados

Observed on 2026-11-16, local API with the key set by the owner, `anthropic` 2.8.0.

- No key: `python .scratch/ai-hackathon/probar_lector.py` printed three `OK` lines, `origen=precargado`, `motivo=sin_clave`, `fallas=0`.
- With the key: `python .scratch/ai-hackathon/probar_lector.py http://localhost:8000/api 3` printed nine `OK` lines, `origen=ia`, `modelo=claude-sonnet-5-5`, `citas_sin_verificar=0`. Last line: `llamadas=9 mediana=4.6s max=7.3s fallas=0`. The first real call did not return a 400.
- Latency note: on this machine every call the script makes to `localhost` carries about 2.1 s that is not the API (a `GET /api/cotizaciones-ejemplo` took 2.09 s through `localhost` and 0.00 s through `127.0.0.1` with `urllib`). The browser does not pay it: see ticket 05.
- Timeout path with `IA_TIMEOUT_S = 0.001`: not run. uvicorn runs in the owner's shell (the only one with the key) and the check needs two restarts there. The `APITimeoutError` branch was exercised with a mocked client: `origen=precargado`, `motivo=timeout`.
- SDK-missing path: not run in a virtual environment. Exercised by forcing the import to fail in a throwaway script: `motivo=sin_sdk` and `GET /api/buque/9436000` answered 200.
- Secrets: `git grep -n "sk-ant" -- .` matches only the two ticket lines that quote the command itself; `git status --short` shows no `.env`.
- UI: the sample "Cotización de agencia: Quequén" showed "Leído por IA (modelo claude-sonnet-5-5). Revisá cada valor antes de aplicarlo." Applied: Bahía Blanca -USD 652.200 / +USD 4.667.800; Quequén -USD 558.900 / +USD 4.761.100, "Mejor opción", "Según cotización". They match spec D9.
