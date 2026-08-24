# prospection-service

"Prospection augmentée" (cahier des charges module 2.6) — détection
d'entreprises visitant le profil public d'une agence, score d'intention
d'achat explicable (barème pondéré configurable depuis Frappe Admin),
génération d'emails de prospection assistée par IA, et stubs pour campagnes
multicanales / synchronisation CRM (fonctionnalités SHOULD).

Node.js + Express, port **8084**, base Postgres dédiée `prospection`. Voir
`docs/INTEGRATION.md` §6 pour le contrat d'intégration complet avec Frappe.

## Lancer en standalone

```bash
cd prospection-service
cp .env.example .env   # puis éditer DATABASE_URL / FRAPPE_URL / INTERNAL_SERVICE_TOKEN
npm install
npm run migrate         # applique src/models/schema.sql sur DATABASE_URL
npm start                # écoute sur :8084 (PORT)
```

En développement avec rechargement automatique : `npm run dev` (utilise
`node --watch`).

## Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `DATABASE_URL` | oui | Connexion Postgres, db `prospection` (ex: `postgresql://platform:platform@localhost:5432/prospection`) |
| `FRAPPE_URL` | oui | Base URL de Frappe (ex: `http://localhost:8000` en local, `http://frappe:8000` en docker-compose) |
| `INTERNAL_SERVICE_TOKEN` | oui | Jeton `X-Internal-Token` pour appeler `platform_core.api.prospection.*` |
| `OPENAI_API_KEY` | non | Si absent, `emailGenerator.js` utilise un template déterministe (`provider: "stub"`) au lieu d'appeler OpenAI |
| `OPENAI_MODEL` | non | Défaut `gpt-4o-mini` |
| `FRONTEND_URL` | non | Origine autorisée en CORS (défaut `http://localhost:3000`) |
| `PORT` | non | Défaut `8084` |
| `LOG_LEVEL` | non | `debug\|info\|warn\|error`, défaut `info` |
| `SCORING_RULES_CACHE_TTL_MS` | non | Durée de cache du barème récupéré depuis Frappe (défaut 5 min) |
| `IP_DETECTOR_TIMEOUT_MS` / `FRAPPE_TIMEOUT_MS` / `OPENAI_TIMEOUT_MS` | non | Timeouts réseau |

## Initialiser le schéma Postgres

Pas de framework de migration lourd (Prisma/Knex) — `src/models/schema.sql`
est un script idempotent (`CREATE TABLE IF NOT EXISTS`), appliqué par :

```bash
npm run migrate
```

Tables créées : `visits` (historique complet, source de vérité — cf.
docs/INTEGRATION.md §6), `leads` (état agrégé par `agency` + `session_id`,
lu par `GET /api/prospection/leads`), `campaigns` (CRUD minimal SHOULD).

## Endpoints

Tous sous `/api/prospection/**`, plus `GET /health` à la racine.

- `POST /api/prospection/track` — enregistre une action trackée par le
  frontend sur le profil public d'une agence. Body :
  `{ agency, action, session_id, ip?, duration_seconds?, count?, company_name?, company_domain? }`.
  `action` accepte soit le libellé français exact du barème
  (`"Consultation du profil"`, `"Consultation portfolio"`, `"Consultation avis"`,
  `"Consultation équipe"`, `"Consultation certifications"`, `"Ajout aux favoris"`),
  soit un alias court (`profile`, `portfolio`, `reviews`, `team`,
  `certifications`, `favorite`). Réponse :
  `{ classification, cumulative_score, points_awarded, bonus_applied, company_resolution }`.
- `GET /api/prospection/leads` — liste des leads pour l'agence
  (`X-Agency-Id`), filtrable par `?classification=Chaud|Tiède|Froid` et
  `?from=&to=` (ISO dates, sur `last_seen_at`).
- `POST /api/prospection/leads/:id/generate-email` — génère un brouillon
  d'email de prospection pour un lead (IA si `OPENAI_API_KEY` défini, sinon
  template stub explicitement marqué).
- `GET /api/prospection/campaigns`, `POST /api/prospection/campaigns` — CRUD
  minimal pour les campagnes multicanales (SHOULD).
- `POST /api/prospection/leads/:id/crm-export` — endpoint bonus exposant
  l'interface `crmSync` (SHOULD, non branchée à un vrai CRM, cf. ci-dessous).
- `GET /health` — 200 toujours, `db.up: true|false` selon la connectivité
  Postgres réelle (ne crashe jamais si la DB est down).

## Score d'intention d'achat (2.6.1)

Le barème (points de base / bonus / seuils chaud-tiède-froid / fenêtre
glissante) est **récupéré en direct depuis Frappe**
(`platform_core.api.prospection.get_scoring_rules`) et mis en cache quelques
minutes (`SCORING_RULES_CACHE_TTL_MS`) — jamais codé en dur comme source
principale. `src/services/scoreCalculator.js` contient une copie de secours
(`FALLBACK_RULES`) strictement identique aux seed defaults Frappe
(`platform_core/platform_core/setup.py::_ensure_lead_scoring_rules`),
utilisée uniquement si Frappe est injoignable, avec un log `warn` explicite
— jamais silencieusement.

Ce qui reste fixé dans le code (et pas dans Frappe) : **à quel champ
observé** (durée, nombre d'éléments consultés) correspond le palier bonus de
chaque action, et à quel seuil il se déclenche (`> 1 min`, `> 5 projets`,
`> 3 avis`, `> 2 membres`, `> 2 certificats`). C'est un choix assumé :
`LeadScoringRule.bonus_condition` côté Frappe est un champ texte libre pour
l'admin ("durée > 1 min"), pas une expression machine-parsable — la valeur
en points reste 100% pilotable depuis l'Admin, mais la sémantique de chaque
palier (quelle métrique, quel seuil) est celle du cahier des charges 2.6.1
et ne varie pas.

## Détection IP -> entreprise

`src/services/ipDetector.js` : pour les IP privées/réservées (tout le trafic
de dev local et les sauts internes docker-compose), retourne un résultat
mock explicite (`provider: "mock"`) sans appel réseau. Pour une IP publique,
tente une résolution via une API de géolocalisation IP gratuite sans clé
(ipwho.is par défaut, configurable via `IP_DETECTOR_URL`).

**Limite assumée et documentée** : ce n'est PAS une résolution IP -> entreprise
de qualité B2B (type Clearbit Reveal / Leadfeeder / Albacross), qui repose
sur des bases de données propriétaires payantes. Une API de géolocalisation
gratuite retourne le nom de l'organisation ASN/FAI propriétaire du bloc IP —
ce qui peut approcher l'entreprise réelle pour une ligne professionnelle
dédiée, mais donnera souvent le nom d'un FAI grand public, d'un hébergeur
cloud ou d'un VPN. Chaque résultat porte un champ `confidence` (`"low"` pour
les résolutions réseau, `"none"` pour les mocks) pour rester honnête plutôt
que d'afficher un nom d'entreprise comme une identité vérifiée. Passer à un
vrai fournisseur B2B plus tard ne nécessite que de remplacer
`resolveViaFreeGeoApi()`.

## Génération d'email IA

`src/services/emailGenerator.js` : appelle OpenAI (`chat/completions`) si
`OPENAI_API_KEY` est défini, avec repli automatique + `degraded: true` sur
un template déterministe en cas d'erreur API. Si la clé est absente dès le
départ, retourne directement le template avec `provider: "stub"` — jamais un
faux succès silencieux.

## Synchronisation CRM (SHOULD)

`src/services/crmSync.js` expose une interface pluggable
(`exportLead(lead, provider)`) avec des fournisseurs `hubspot` / `pipedrive`
/ `teamleader` non branchés à une vraie API — chaque appel journalise la
tentative et retourne `{ status: "not_configured", ... }`. C'est
volontairement minimal (feature SHOULD) ; brancher un vrai fournisseur
consiste à implémenter `{ export(lead) }` et l'enregistrer dans `PROVIDERS`.

## Notes de déviation par rapport à docs/INTEGRATION.md

- **§5 (routes Gateway)** liste `/api/prospection/** | JWT requis,
  user_type=agency` sans distinction de route. `POST /api/prospection/track`
  est cependant appelé par un visiteur anonyme sur le profil public d'une
  agence (pas par un utilisateur agence connecté) — cette route est donc
  volontairement implémentée sans exiger `X-Agency-Id`/`X-User-Type`, cf.
  consigne de la tâche ("public-ish tracking pixel/call"). Les autres routes
  (`/leads`, `/leads/:id/generate-email`, `/campaigns`, `/leads/:id/crm-export`)
  restent scopées agence via `X-Agency-Id`. Ce point mériterait d'être
  clarifié dans `docs/INTEGRATION.md` côté configuration Gateway (route
  publique dédiée pour `/api/prospection/track`, comme cela existe déjà pour
  `agency.get_profile`/`track_website_click` §5) — non modifié ici, scope
  limité à `prospection-service/`.
- Ce service ne re-vérifie pas la signature JWT (fait confiance au réseau
  interne + aux en-têtes `X-User-Email`/`X-User-Type`/`X-Agency-Id` posés par
  le Gateway), conformément à docs/INTEGRATION.md §3.

## Docker

```bash
docker build -t prospection-service .
docker run --rm -p 8084:8084 --env-file .env prospection-service
```

`Dockerfile` : base `node:22-slim`, `npm ci`, `EXPOSE 8084`,
`CMD node src/index.js`.
