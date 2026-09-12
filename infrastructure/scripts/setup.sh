#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
	echo "==> Création de .env à partir de .env.example"
	cp .env.example .env
fi

echo "==> Build des images (peut prendre plusieurs minutes, notamment l'image Frappe)"
docker compose build

echo "==> Démarrage des services"
docker compose up -d

echo "==> Services démarrés. Suivre les logs avec : docker compose logs -f"
echo "    Frontend        : http://localhost:3000"
echo "    API Gateway     : http://localhost:8080"
echo "    Frappe (direct) : http://localhost:8000"
echo "    RabbitMQ admin  : http://localhost:15672"
