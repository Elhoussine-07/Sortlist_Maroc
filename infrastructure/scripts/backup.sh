#!/bin/bash
# Sauvegarde du site Frappe (base + fichiers privés/publics) via bench.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SITE="${FRAPPE_SITE:-plateforme.localhost}"
OUT_DIR="./backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

docker compose exec frappe bench --site "$SITE" backup --with-files
docker compose cp "frappe:/home/frappe/frappe-bench/sites/$SITE/private/backups/." "$OUT_DIR"

echo "==> Sauvegarde copiée dans $OUT_DIR"
