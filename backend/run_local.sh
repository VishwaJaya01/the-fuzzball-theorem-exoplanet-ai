#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export MODEL_DIR="${MODEL_DIR:-${PROJECT_ROOT}/artifacts}" \
       PROCESSED_DIR="${PROCESSED_DIR:-${PROJECT_ROOT}/data/processed}" \
       INTERIM_DIR="${INTERIM_DIR:-${PROJECT_ROOT}/data/interim}"

mkdir -p "${MODEL_DIR}" "${PROCESSED_DIR}" "${INTERIM_DIR}" "${INTERIM_DIR}/features"

exec uvicorn app.main:APP --host 0.0.0.0 --port 7860 --reload
