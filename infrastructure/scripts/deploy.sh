#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

git pull
docker compose build
docker compose up -d
docker compose exec frappe bench --site "${FRAPPE_SITE:-plateforme.localhost}" migrate
