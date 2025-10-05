# Exoplanet AI Backend

FastAPI service for the NASA Space Apps exoplanet challenge. The API is CPU-only, stateless, and loads trained artifacts from a configurable directory at runtime. It computes Box Least Squares (BLS) features per request, caches them when TIC IDs are used, and produces a planet-likeness score today with seamless upgrade to calibrated probabilities.

## Requirements

- Python 3.12
- Model artifacts and processed light curves on disk
- Optional: Docker, Poetry/virtualenv (not bundled)

Install python dependencies:

```bash
pip install -r backend/requirements.txt
```

## Environment Configuration

All paths are configurable through environment variables (defaults shown):

| Variable | Purpose | Default |
| --- | --- | --- |
| `MODEL_DIR` | Directory with model artifacts (`latest.txt`, `model_*`, `scaler_*`, etc.) | `/data/model` |
| `PROCESSED_DIR` | Location of processed light curves (`lightcurves/TIC-<id>.parquet`) | `/data/processed` |
| `INTERIM_DIR` | Writable cache for computed features | `/data/interim` |
| `ALLOW_CORS` | Comma-separated allowlist or `*` | `*` |
| `PERIOD_MIN`, `PERIOD_MAX`, `N_PERIODS` | BLS period grid configuration | `0.5`, `30.0`, `5000` |
| `DUR_MIN_H`, `DUR_MAX_H` | BLS durations in hours | `0.5`, `10.0` |

For Hugging Face Spaces, place persistent data under `/data` to leverage the provided volume.

## Directory Expectations

```
${MODEL_DIR}/
  latest.txt
  model_iso_*.pkl or model_xgb_*.json
  scaler_*.pkl
  feature_names_*.json
  calibrator_*.pkl          # optional (supervised)

${PROCESSED_DIR}/lightcurves/
  TIC-12345678.parquet      # columns: time, flux, optional flux_err

${INTERIM_DIR}/features/     # created automatically for cached Series
```

## Local Development

Use the helper script to export env vars and launch with reload:

```bash
cd backend
./run_local.sh
```

Or run manually:

```bash
export MODEL_DIR="$(pwd)/../artifacts"
export PROCESSED_DIR="$(pwd)/../data/processed"
export INTERIM_DIR="$(pwd)/../data/interim"
uvicorn app.main:APP --host 0.0.0.0 --port 7860 --reload
```

## Docker

Build and run the container:

```bash
cd backend
docker build -t exoplanet-ai-backend .
docker run --rm -p 7860:7860 \
  -v "$PWD/../artifacts":/data/model \
  -v "$PWD/../data/processed":/data/processed \
  -v "$PWD/../data/interim":/data/interim \
  exoplanet-ai-backend
```

## API Overview

- `GET /health` – service pulse
- `GET /version` – current mode (`one_class` or `supervised`) and artifact name
- `GET /model/info` – artifact directory, feature metadata, scaler/calibrator flags
- `GET /predict/by_tic?tic_id=<int>` – load TIC parquet, reuse cached features when present
- `POST /predict/from_lightcurve` – send raw arrays, compute BLS features on demand

### Response Notes

- `mode=one_class` ? `is_probability=false`, `score` represents planet-likeness from the IsolationForest decision function (scaled to `[0,1]`).
- `mode=supervised` ? `is_probability=true`, `score` is a calibrated probability when a calibrator artifact is provided.
- `warnings` will include `insufficient_data` when BLS cannot operate; the API returns HTTP 422 in that case.

### Example Calls

```bash
curl -s http://localhost:7860/health
curl -s "http://localhost:7860/predict/by_tic?tic_id=396740648" | jq .
curl -s -X POST http://localhost:7860/predict/from_lightcurve \
  -H "Content-Type: application/json" \
  -d '{"time":[1,2,3,4], "flux":[1.0,0.999,1.001,1.0]}'
```

Logs are emitted as JSON (stdout) and include tic_id, mode, runtime, and score for easy ingestion into observability tooling.

### Optional: Automatic Light Curve Fetching

Set `AUTO_FETCH_MISSING=1` (and optionally `AUTO_FETCH_AUTHOR` / `AUTO_FETCH_FLUX`) to let the service auto-download missing TIC light curves from MAST using `lightkurve`. Install the dependency first (`python -m pip install lightkurve`) or include it via `backend/requirements.txt`. When enabled, `/predict/by_tic` will fetch, cache, and score unseen targets transparently.
