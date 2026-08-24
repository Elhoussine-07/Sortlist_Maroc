#!/bin/bash
# Idempotent : à la première exécution, installe l'app platform_core et crée
# le site s'il n'existe pas encore. Aux exécutions suivantes, se contente de
# démarrer bench. Nécessite MariaDB + Redis déjà joignables (docker-compose
# `depends_on` + `healthcheck` s'en chargent).
set -e

cd "$BENCH_PATH"

SITE_NAME="${FRAPPE_SITE:-plateforme.localhost}"
DB_HOST="${DB_HOST:-mariadb}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-platform_root}"
ADMIN_PASSWORD="${FRAPPE_ADMIN_PASSWORD:-admin}"
REDIS_CACHE="${REDIS_CACHE_URL:-redis://redis:6379/0}"
REDIS_QUEUE="${REDIS_QUEUE_URL:-redis://redis:6379/1}"

bench set-config -g db_host "$DB_HOST"
bench set-config -g redis_cache "$REDIS_CACHE"
bench set-config -g redis_queue "$REDIS_QUEUE"
bench set-config -g redis_socketio "$REDIS_QUEUE"
bench set-config -g developer_mode 1
bench set-config -g jwt_secret "${JWT_SECRET:-dev-insecure-secret-change-me}"
bench set-config -g internal_service_token "${INTERNAL_SERVICE_TOKEN:-dev-insecure-internal-token}"
bench set-config -g notifications_url "${NOTIFICATIONS_URL:-http://notifications-service:8085}"
# Permet l'accès direct navigateur à Frappe (hors Gateway) pendant le dev,
# cf. docs/INTEGRATION.md §3 ("rester utilisable en accès direct pendant le dev").
bench set-config -g allow_cors "${FRONTEND_URL:-http://localhost:3000}"

if [ ! -d "apps/platform_core" ]; then
	echo "==> Installation de l'app platform_core dans le bench"
	bench get-app platform_core /home/frappe/platform_core_src
fi

# Attendre que MariaDB accepte les connexions avant de tenter new-site.
echo "==> Attente de MariaDB ($DB_HOST)..."
until mysqladmin ping -h "$DB_HOST" -u root -p"$DB_ROOT_PASSWORD" --silent 2>/dev/null; do
	sleep 2
done

if [ ! -d "sites/$SITE_NAME" ]; then
	echo "==> Création du site $SITE_NAME"
	bench new-site "$SITE_NAME" \
		--db-root-username root \
		--db-root-password "$DB_ROOT_PASSWORD" \
		--admin-password "$ADMIN_PASSWORD" \
		--no-mariadb-socket

	bench --site "$SITE_NAME" install-app platform_core
	bench use "$SITE_NAME"
else
	echo "==> Site $SITE_NAME déjà existant — migration"
	bench --site "$SITE_NAME" migrate
fi

exec "$@"
