# Contrat d'intégration — Plateforme B2B (monorepo `platform_core`)

Ce document est la référence commune à tous les services du monorepo. Toute
implémentation d'un service DOIT respecter ce contrat pour rester compatible
avec les autres. Le **service de recherche est hors périmètre** pour cette
itération (dossier `search-service/` non créé, aucune route gateway ne pointe
vers lui).

## 1. Organisation du monorepo

Le dépôt `platform_core` est la racine du monorepo (adapté du schéma
d'architecture — pas de dossier `frappe-bench/`, l'app Frappe est directement
`platform_core/` à la racine) :

```
platform_core/                 racine du repo (= "projet-platform-core")
├── platform_core/             app Frappe (cœur métier, existant)
├── api-gateway/                Spring Cloud Gateway — port 8080
├── matching-service/           Spring Boot — port 8081
├── ia-service/                 FastAPI — port 8083
├── prospection-service/        Node.js — port 8084
├── notifications-service/      Node.js + Socket.IO — port 8085
├── frontend/                   React — port 3000
├── infrastructure/             docker-compose, nginx
└── docs/
    └── INTEGRATION.md          ce fichier
```

`search-service/` (Elasticsearch, port 8082) reste dans le schéma cible mais
n'est **pas implémenté ni démarré** dans `docker-compose.yml` pour l'instant.
La recherche sémantique publique (module 3.1 / 4.1) est temporairement
assurée par une recherche simple (SQL `LIKE` / filtres) exposée par Frappe
(`platform_core.platform_core.api.search.search_agencies`), à remplacer plus tard par le vrai service.

## 2. Table des ports & bases de données

| Service | Techno | Port | DB |
|---|---|---|---|
| Frappe (`platform_core`) | Python/Frappe 15 | 8000 | MariaDB 3306 |
| API Gateway | Spring Cloud Gateway | 8080 | — |
| Matching | Spring Boot | 8081 | Postgres 5432 / db `matching` |
| ~~Recherche~~ | ~~Elasticsearch~~ | ~~8082~~ | hors périmètre |
| IA | FastAPI | 8083 | — (stateless) |
| Prospection | Node.js | 8084 | Postgres 5432 / db `prospection` |
| Notifications | Node.js + Socket.IO | 8085 | — (relais + Redis pub/sub) |
| Frontend | React | 3000 | — |
| Redis | — | 6379 | cache Frappe, pub/sub notifications |
| RabbitMQ | — | 5672 | événements async (ex: `lead.hot`) |

Le frontend ne parle **qu'au Gateway** (`http://localhost:8080`) et, pour le
temps réel, directement à `notifications-service` (Socket.IO, CORS ouvert
sur `FRONTEND_URL`). Aucun autre service n'est appelé directement par le
frontend en production.

## 3. Authentification — JWT partagé

- Algorithme **HS256**, secret partagé via la variable d'environnement
  `JWT_SECRET` (identique dans tous les services).
- Émis exclusivement par Frappe après login/OTP :
  `POST /api/method/platform_core.platform_core.api.auth.login`
  `POST /api/method/platform_core.platform_core.api.auth.verify_otp`
- Durée de vie : 24h (`exp`). Pas de refresh token dans cette itération —
  le frontend redemande une connexion à expiration.
- Claims du payload :
  ```json
  {
    "sub": "user@example.com",
    "user_type": "client | agency | moderator | admin",
    "agency_id": "AGENCY-0001 | null",
    "full_name": "Jane Doe",
    "iat": 1234567890,
    "exp": 1234654290
  }
  ```
  `agency_id` correspond à l'agence **active** (contexte du switch
  multi-agences, cf. 2.1.1) pour un `user_type = "agency"`.
- Le frontend envoie `Authorization: Bearer <jwt>` sur chaque appel
  authentifié.
- **Le Gateway valide la signature/expiration du JWT** (`AuthenticationFilter`
  + `JwtUtil`) sur toutes les routes sauf celles listées en §5 "Routes
    publiques". En cas d'échec : `401`.
- Le Gateway ajoute ensuite ces en-têtes pour les services en aval (qui n'ont
  donc pas à re-décoder le JWT, ils font confiance au réseau interne Docker
  où seuls le Gateway et le Frontend sont exposés à l'hôte) :
  - `X-User-Email`
  - `X-User-Type`
  - `X-Agency-Id`
- **Frappe valide lui-même le JWT en plus du Gateway** (défense en
  profondeur, et pour rester utilisable en accès direct pendant le dev) via
  un hook `before_request` (`platform_core.platform_core.auth.validate_jwt`) qui lit
  `Authorization`, décode le JWT, et peuple `frappe.local.jwt_user`.

## 4. Jeton de service interne (service-to-service)

Les endpoints Frappe préfixés `platform_core.platform_core.api.matching.*`,
`platform_core.platform_core.api.prospection.*`, `platform_core.platform_core.api.ia.*` sont appelés par
les microservices correspondants pour lire/écrire des données métier (ex :
`matching-service` récupère un `Project` + les `AgencyProfile` candidates,
`prospection-service` récupère le barème `LeadScoringRule`).

- En-tête requis : `X-Internal-Token: <INTERNAL_SERVICE_TOKEN>`
- Variable d'env `INTERNAL_SERVICE_TOKEN`, identique partout.
- `platform_core.platform_core.api.payment.stripe_webhook` n'utilise **pas** ce jeton : il
  vérifie la signature Stripe (`Stripe-Signature` + `STRIPE_WEBHOOK_SECRET`).

## 5. Routes du Gateway

| Path préfixe | Cible | Auth |
|---|---|---|
| `/api/method/platform_core.platform_core.api.auth.**` | Frappe :8000 | publique (login/otp/register) |
| `/api/method/platform_core.platform_core.api.**` | Frappe :8000 | JWT requis |
| `/api/resource/**` | Frappe :8000 | JWT requis |
| `/files/**` | Frappe :8000 | publique (fichiers `is_private=0` : logo/couverture agence, photos d'équipe, portfolio...) |
| `/private/files/**` | Frappe :8000 | JWT requis |
| `/api/matching/**` | matching-service :8081 | JWT requis |
| `/api/ia/**` | ia-service :8083 | JWT requis (sauf `/api/ia/chatbot/public`) |
| `/api/prospection/**` | prospection-service :8084 | JWT requis, `user_type=agency` — **sauf** `/api/prospection/track` (public, cf. note ci-dessous) |
| `/socket.io/**` | notifications-service :8085 | JWT en query param `token` (Socket.IO) |

Chaque service en aval expose ses routes **sans** re-préfixer par son propre
nom (ex: matching-service écoute lui-même sur `/api/matching/**`, pas sur
`/**`), pour que le Gateway fasse un simple passthrough sans réécriture de
path.

### Routes Frappe publiques (pas de JWT requis)

Ces méthodes sont `@frappe.whitelist(allow_guest=True)` côté Frappe — le
Gateway ne doit **pas** exiger de JWT dessus (sinon la recherche publique et
l'inscription cassent) :

- `platform_core.platform_core.api.auth.request_otp`, `.verify_otp`, `.login`,
  `.register_client`, `.register_agency`
- `platform_core.platform_core.api.agency.get_profile`, `.list_agencies`, `.track_website_click`, `.check_name_availability`
- `platform_core.platform_core.api.search.search_agencies`, `.search_natural_language`
- `platform_core.platform_core.api.review.list_agency_reviews`
- `platform_core.platform_core.api.opportunity.list_public_projects` (page /projets, visiteur anonyme)
- `platform_core.platform_core.api.utils.ping`, `.get_categories`, `.get_legal_id_rule`, `.validate_legal_id`

Toutes les autres méthodes sous `platform_core.platform_core.api.**` exigent un JWT valide.

De la même façon, `POST /api/prospection/track` (prospection-service, pas
Frappe) est **public** : c'est l'appel de tracking déclenché par un visiteur
anonyme sur la page publique d'un profil agence (détection IP, module 2.6) —
il ne peut pas exiger de JWT. Toutes les autres routes `/api/prospection/**`
restent `JWT requis, user_type=agency`.

### Endpoints internes — PAS de route Gateway

`platform_core.platform_core.api.matching.*`, `platform_core.platform_core.api.prospection.*`,
`platform_core.platform_core.api.ia.*` et `platform_core.platform_core.api.payment.stripe_webhook` sont
appelés **directement service-à-service** à l'intérieur du réseau Docker
(ex: `http://frappe:8000/api/method/platform_core.platform_core.api.matching.get_project_context`),
protégés par `X-Internal-Token`. Le Gateway n'a **aucune route** vers eux —
ce ne sont pas des endpoints frontend.

## 6. Endpoints internes Frappe consommés par les autres services

Tous préfixés par `X-Internal-Token`.

### matching-service
- `GET  /api/method/platform_core.platform_core.api.matching.get_project_context?project=<id>`
  → `{ project: {...}, candidate_agencies: [...] }`
- `POST /api/method/platform_core.platform_core.api.matching.save_shortlist`
  body `{ project: <id>, shortlist: [{agency, score, success_prediction}] }`
  → persiste dans `Project.shortlist_ia`

### ia-service
- `GET  /api/method/platform_core.platform_core.api.ia.get_categories` → catégories/sous-catégories actives
- `POST /api/method/platform_core.platform_core.api.ia.create_project_from_briefing`
  body `{ client, brief: {...} }` → crée le `Project` (statut `Draft` puis `Posted`)
  et déclenche la génération du CDC PDF (§7)

### prospection-service
- `GET  /api/method/platform_core.platform_core.api.prospection.get_scoring_rules` → `{ rules: LeadScoringRule[], thresholds: {hot, warm_min, warm_max, window_days} }`
- `GET  /api/method/platform_core.platform_core.api.prospection.get_agency_directory` → agences actives (pour associer un visiteur à une agence visitée)
- `POST /api/method/platform_core.platform_core.api.prospection.log_visitor`
  body `{ agency, action, visitor_ip, company_name, company_domain, session_id }`
  → miroir côté Frappe (doctype `VisitorLog`) pour affichage dans le dashboard
  Agence (module 2.6). prospection-service reste la source de vérité pour le
  détail des visites (sa propre base Postgres) ; cet appel n'est qu'un résumé
  pour l'UI Frappe/Analytics.

### notifications-service (appelé PAR Frappe, pas l'inverse)
- Frappe → `POST http://notifications-service:8085/internal/notify`
  header `X-Internal-Token`
  body `{ recipient_email, type, title, body, link, notification_id }`
  déclenché par `doc_events` sur le DocType `Notification` (`after_insert`).

## 7. Génération du CDC (cahier des charges PDF)

Générée **côté Frappe** (pas par ia-service) via un Print Format Jinja
(`platform_core/platform_core/doctype/project/print_format_cdc.html`) rendu
avec `frappe.utils.pdf.get_pdf`, attaché au champ `Project.cdc_file`. Deux
points d'entrée produisent le même document :

1. Smart Briefing IA (`ia.create_project_from_briefing`)
2. Formulaire Unicast/Multicast (`platform_core.platform_core.api.quick_actions.send_unicast` /
   `send_multicast`)

Le CDC passe en lecture seule (`cdc_locked=1`) au passage du `Project` en
statut `In Progress` (cf. §8).

## 8. Statuts `Project` (valeurs internes ↔ cahier des charges)

`Draft → Posted → Awaiting → In Progress → {Suspended} → Completed`
ou `Rejected` (sous-statuts `rejection_substatus`: `Refusé | Supprimé | Client inactif`)

| Valeur interne | Cahier des charges |
|---|---|
| Draft | Brouillon (avant publication) |
| Posted | Postulé |
| Awaiting | En attente |
| In Progress | En cours |
| Suspended | Suspendu |
| Completed | Terminé |
| Rejected | Rejeté |

Workflow du devis en deux étapes (cf. cahier §1.3.3) implémenté sur
`Opportunity.status` : `Reçue → Acceptée → Devis envoyé → Gagnée|Archivée`.
Voir `platform_core/platform_core/doctype/opportunity/opportunity.py` et
`platform_core/platform_core/doctype/proposal/proposal.py`.

## 9. Variables d'environnement communes

| Variable | Description |
|---|---|
| `JWT_SECRET` | secret HS256 partagé |
| `INTERNAL_SERVICE_TOKEN` | jeton service-to-service vers Frappe |
| `FRAPPE_URL` | `http://frappe:8000` (interne docker) |
| `FRAPPE_SITE` | `plateforme.localhost` |
| `GATEWAY_URL` | `http://api-gateway:8080` |
| `NOTIFICATIONS_URL` | `http://notifications-service:8085` |
| `MATCHING_URL` | `http://matching-service:8081` |
| `IA_URL` | `http://ia-service:8083` |
| `PROSPECTION_URL` | `http://prospection-service:8084` |
| `FRONTEND_URL` | `http://localhost:3000` (CORS) |
| `DATABASE_URL` (matching/prospection) | `postgresql://platform:platform@postgres:5432/<db>` |
| `REDIS_URL` | `redis://redis:6379` |
| `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672` |
| `OPENAI_API_KEY` | optionnel — si absent, `ia-service` et `prospection-service` (emails IA) utilisent un générateur de texte stub déterministe, pas un stub "fake success" silencieux : la réponse indique `"provider": "stub"` |

## 10. Règles pour chaque service ajouté au monorepo

- Un `Dockerfile` à la racine du service.
- Un `/health` (ou `/actuator/health` en Spring) répondant `200` sans auth,
  utilisé par `docker-compose healthcheck`.
- Aucune logique métier dupliquée : Frappe reste la source de vérité pour
  Project/Opportunity/Proposal/Invoice/Notification. Les autres services
  calculent (scoring, texte IA, détection IP) mais persistent le résultat
  soit dans leur propre base (matching/prospection), soit en le renvoyant
  à Frappe via les endpoints internes du §6.