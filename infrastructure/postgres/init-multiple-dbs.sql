-- Exécuté automatiquement au premier démarrage du conteneur Postgres
-- (docker-entrypoint-initdb.d). Deux bases logiques distinctes sur la même
-- instance, cf. docs/INTEGRATION.md §2 : matching-service et
-- prospection-service ne partagent aucune table.
CREATE DATABASE matching;
CREATE DATABASE prospection;
GRANT ALL PRIVILEGES ON DATABASE matching TO platform;
GRANT ALL PRIVILEGES ON DATABASE prospection TO platform;
