### Plateforme B2B — orchestration multi-repo

Plateforme de mise en relation entreprises & prestataires (cf. le cahier des
charges fonctionnel), organisée en 3 dépôts + microservices. **Le service de
recherche (search-service / Elasticsearch) est volontairement hors périmètre
pour l'instant** — la recherche publique retombe temporairement sur un stub
SQL simple côté Frappe (`platform_core.platform_core.api.search`), documenté
dans `docs/INTEGRATION.md §1`.

### Structure attendue sur disque

Ce dépôt orchestre deux dépôts frères via `docker-compose.yml` — **les trois
doivent être clonés (ou dézippés) côte à côte, sous le même dossier parent,
avec exactement ces noms de dossier** :

```
<dossier parent>/
├── microservices/            CE DÉPÔT — api-gateway, microservices, docker-compose (ici)
├── platform_core/            app Frappe (cœur métier, source de vérité)
└── frontend/                 React / TanStack Start — interface utilisateur (3000)
```

`docker-compose.yml` référence `../platform_core` (bind mount de la source de
l'app, service `frappe` — commenté par défaut, cf. plus bas) et construit
l'image frontend depuis `../frontend` (`build.context`) — sans ce layout,
`docker compose build`/`up` échoue à trouver ces dossiers.

```
microservices/ (ce dépôt)
├── api-gateway/              Spring Cloud Gateway — point d'entrée unique (8080)
├── matching-service/         Spring Boot — scoring & prédiction de succès (8081)
├── ia-service/                FastAPI — Smart Briefing, catégorisation, chatbot (8083)
├── prospection-service/       Node.js — détection IP, scoring de leads (8084)
├── notifications-service/     Node.js + Socket.IO — relais temps réel (8085)
├── infrastructure/            Dockerfile Frappe, nginx, scripts
└── docs/INTEGRATION.md        contrat d'intégration entre tous les services — À LIRE EN PREMIER
```

### Démarrage rapide (toute la plateforme)

```bash
# 1. Cloner/dézipper les 3 dépôts côte à côte, avec ces noms exacts (cf. structure ci-dessus)
git clone <url>/microservices.git
git clone <url>/platform_core.git
git clone <url>/frontend.git

# 2. Configurer les secrets
cd microservices
cp .env.example .env   # ajuster les secrets si besoin (valeurs par défaut = dev uniquement)

# 3. Build + démarrage
docker compose build
docker compose up -d
```

Ou directement : `./infrastructure/scripts/setup.sh`

Le premier démarrage du conteneur `frappe` est plus long : il installe l'app
`platform_core` et crée le site (`entrypoint.sh`). Suivre la progression avec
`docker compose logs -f frappe`.

### Accès une fois démarré

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3000 | interface utilisateur |
| API Gateway | http://localhost:8080 | point d'entrée du frontend, seul service que le frontend appelle directement (+ notifications-service pour Socket.IO) |
| Frappe (accès direct/admin) | http://localhost:8000 | Desk admin : `Administrator` / mot de passe `FRAPPE_ADMIN_PASSWORD` (`.env`) |
| Notifications (Socket.IO) | http://localhost:8085 | appelé directement par le frontend, hors Gateway |
| RabbitMQ admin | http://localhost:15672 | identifiants `RABBITMQ_USER` / `RABBITMQ_PASSWORD` |
| Matching / IA / Prospection | 8081 / 8083 / 8084 | usage interne uniquement, non exposés au frontend |

### Variables d'environnement

Voir `.env.example` (racine de ce dépôt) pour la liste complète avec
description ; les valeurs par défaut fonctionnent telles quelles pour un
premier lancement local. À ajuster avant tout déploiement non local :
`JWT_SECRET`, `INTERNAL_SERVICE_TOKEN`, `DB_ROOT_PASSWORD`,
`FRAPPE_ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (si le
paiement est activé).

### Contrat d'intégration

`docs/INTEGRATION.md` documente en détail : la table des ports/bases de
données, l'authentification JWT partagée, le jeton de service interne, les
routes du Gateway, et le format exact des appels service-à-service. À lire
avant toute modification touchant plusieurs services.

### License

mit
