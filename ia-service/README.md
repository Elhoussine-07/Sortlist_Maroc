# ia-service

Microservice FastAPI (port **8083**) portant le **Smart Briefing IA** (cahier
des charges §1.2) et l'**Assistant conversationnel / Chatbot** (§3.4) de la
plateforme B2B. Service **stateless** : aucune base de données propre — la
source de vérité pour les `Project` reste Frappe (`platform_core/`), que ce
service appelle en interne. Voir `docs/INTEGRATION.md` §6 pour le contrat
complet.

## Ce que fait (et ne fait pas) ce service

- Il **mène la conversation** du Smart Briefing (questions adaptatives,
  catégorisation automatique, enrichissement du brief) côté client, de
  façon stateless : l'état de la conversation (`current_brief`,
  `conversation_history`) est porté par le frontend à chaque appel, pas
  stocké ici.
- Il **n'écrit jamais directement en base**. Le seul effet durable qu'il
  déclenche est l'appel à
  `platform_core.api.ia.create_project_from_briefing` côté Frappe (via
  `POST /api/ia/briefing/confirm`), qui crée le `Project` et génère le CDC
  PDF. Frappe reste la source de vérité (cf. docs/INTEGRATION.md §7, §10).
- Il ne fait **pas** de scoring de matching (`matching-service`, §3.2/3.3)
  ni de recherche sémantique (`search-service`, hors périmètre).

## Endpoints (`/api/ia/*`)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/ia/briefing/turn` | Tour de conversation du Smart Briefing (slot-filling) |
| POST | `/api/ia/briefing/categorize` | Catégorisation auto (catégorie/sous-catégorie) depuis texte libre |
| POST | `/api/ia/briefing/enrich` | Reformulation du besoin + suggestion de budget |
| POST | `/api/ia/briefing/confirm` | Crée le `Project` côté Frappe (source de vérité) |
| POST | `/api/ia/chatbot` | FAQ + aide à la rédaction de brief, avec escalade humaine |
| POST | `/api/ia/chatbot/public` | Alias sans JWT (route publique Gateway, cf. INTEGRATION.md §5) |
| GET | `/api/ia/health`, `/health` | Healthcheck, sans auth |

Le Gateway a déjà validé le JWT de l'utilisateur final et transmet
`X-User-Email` / `X-User-Type` en en-têtes : ce service leur fait confiance
sans re-décoder le JWT (réseau interne Docker uniquement, cf. §3).

## Mode IA : avec ou sans `OPENAI_API_KEY`

- **`OPENAI_API_KEY` absent (par défaut)** : mode **stub déterministe**.
  - Catégorisation par recouvrement de mots-clés (`app/nlp_service.py`)
    contre les catégories/sous-catégories récupérées auprès de Frappe
    (`get_categories`).
  - Slot-filling par machine à états simple (une question fixe par champ
    manquant, dans un ordre défini) avec extraction de champs par regex
    (budget, délai en jours, type de besoin).
  - Enrichissement du brief par reformulation template + table statique de
    budget moyen par mot-clé de catégorie.
  - FAQ du chatbot par une base de connaissances codée en dur, matchée par
    mots-clés ; en dehors de ce périmètre, la réponse indique
    `"escalate": true`.
  - Toutes les réponses portent `"provider": "stub"` — **jamais** de faux
    succès silencieux (cf. docs/INTEGRATION.md §9).
- **`OPENAI_API_KEY` présent** : les mêmes endpoints tentent d'abord un
  appel OpenAI (`app/openai_client.py`, modèle configurable via
  `OPENAI_MODEL`, défaut `gpt-4o-mini`) pour :
  - formuler la question suivante du briefing en français plus naturel ;
  - extraire des champs structurés depuis un message libre ;
  - affiner la catégorisation (toujours **validée** contre le catalogue
    Frappe réel — une catégorie halluciné par le LLM est rejetée et on
    retombe sur l'heuristique par mots-clés) ;
  - reformuler la description du besoin ;
  - répondre aux questions hors FAQ du chatbot.
  - Réponses marquées `"provider": "openai"`. Toute erreur d'appel (réseau,
    quota, clé invalide) fait retomber silencieusement sur le stub
    déterministe pour cet appel précis, sans jamais faire échouer la
    requête HTTP.

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `FRAPPE_URL` | *(absent)* | Override explicite optionnel — si définie, désactive la bascule automatique et fige l'URL Frappe (debug) |
| `FRAPPE_URL_CONTAINER` | `http://frappe:8000` | URL essayée en premier (Frappe en conteneur) — cf. `../docs/FRAPPE_FALLBACK.md` |
| `FRAPPE_URL_LOCAL` | `http://host.docker.internal:8000` | URL de repli si l'URL conteneur ne répond pas (Frappe sur l'hôte) |
| `INTERNAL_SERVICE_TOKEN` | `dev-insecure-internal-token` | Jeton `X-Internal-Token` vers Frappe |
| `OPENAI_API_KEY` | *(absent)* | Optionnel — active le mode LLM assisté |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modèle OpenAI utilisé si la clé est présente |
| `FRONTEND_URL` | `http://localhost:3000` | Origine autorisée en CORS |

## Lancer en standalone

```bash
cd ia-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export FRAPPE_URL=http://localhost:8000
export INTERNAL_SERVICE_TOKEN=dev-insecure-internal-token
# export OPENAI_API_KEY=sk-...   # optionnel

uvicorn app.main:app --host 0.0.0.0 --port 8083 --reload
```

Healthcheck : `curl http://localhost:8083/health`

## Docker

```bash
docker build -t ia-service .
docker run -p 8083:8083 \
  -e FRAPPE_URL=http://frappe:8000 \
  -e INTERNAL_SERVICE_TOKEN=changeme \
  ia-service
```
