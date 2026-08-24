# matching-service

Spring Boot 3.x (Java 21) — moteur de scoring multicritere et de prediction
de succes de collaboration pour la plateforme B2B (cahier des charges §3.2
"Moteur de recommandation IA avance" et §3.3 "Prediction des chances de
succes"). Port **8081** (cf. `docs/INTEGRATION.md` §2).

Ce service ne stocke rien lui-meme (pas de base de donnees branchee dans
cette iteration malgre la colonne "Postgres 5432 / db `matching`" du tableau
des ports) : Frappe reste la source de verite. matching-service lit le
contexte projet/agences chez Frappe, calcule les scores en memoire, renvoie
le classement a l'appelant, et persiste le resultat cote Frappe via
`save_shortlist` (champ `Project.shortlist_ia`) — conformement a la regle
"aucune logique metier dupliquee" (`docs/INTEGRATION.md` §10).

## Endpoints exposes

Le Gateway route `/api/matching/**` vers ce service sans re-prefixer le
chemin (`docs/INTEGRATION.md` §5) ; le JWT est deja verifie par le Gateway,
ce service fait confiance au reseau Docker interne.

| Methode | Chemin | Effet |
|---|---|---|
| `POST` | `/api/matching/{projectId}/shortlist` | Recalcule le classement des agences candidates et **persiste** le resultat cote Frappe (`save_shortlist`) avant de le renvoyer. |
| `GET`  | `/api/matching/{projectId}/shortlist` | Recalcule le meme classement (meme moteur de scoring) mais **sans** appeler `save_shortlist` — utile pour un rafraichissement d'affichage sans re-ecrire l'historique de shortlist. |
| `GET`  | `/actuator/health` | 200 sans auth, pour le healthcheck docker-compose. |

Reponse (les deux routes, forme identique) :

```json
{
  "project": "PROJ-0001",
  "persisted": true,
  "shortlist": [
    {
      "agency": "AGENCY-0007",
      "agency_name": "Acme Studio",
      "matching_score": 82.4,
      "success_prediction": 71.0,
      "factors": [
        "6 projets similaires termines avec succes sur la plateforme",
        "Note moyenne de 4.6/5 sur les avis clients",
        "Score de confiance du client de 78/100",
        "9 ans d'existence (agence fondee en 2017)"
      ],
      "score_breakdown": {
        "location": 100.0,
        "skills": 76.5,
        "budget": 60.0,
        "rating": 92.0,
        "pqi": 85.0
      }
    }
  ]
}
```

## Algorithme de scoring (`ScoringService`)

Deux scores independants sont calcules pour chaque agence candidate
retournee par `get_project_context` :

### 1. `matching_score` (0-100) — scoring multicritere

Moyenne ponderee de cinq facteurs, chacun normalise sur 0-100. Les poids
sont des constantes nommees dans `ScoringService` pour etre faciles a
recalibrer :

| Facteur | Constante | Poids | Calcul |
|---|---|---|---|
| Localisation | `LOCATION_WEIGHT` | 0.20 | 100 si `remote_work=true` ; 100 si la localisation/couverture de l'agence correspond a celle du projet (comparaison normalisee, sans accents) ; 20 sinon ; 50 si donnee manquante. |
| Expertise / competences | `SKILLS_WEIGHT` | 0.35 | Recouvrement (indice de Jaccard) entre les mots-cles de `category`+`sub_category` (poids 0.7) et `description` (poids 0.3) du projet, et les mots-cles de `service_name`+`skills`+`tech_stack` de chaque `AgencyService` de l'agence. |
| Budget | `BUDGET_WEIGHT` | 0.10 | Voir "Deviation" ci-dessous — poids volontairement reduit. |
| Avis clients | `RATING_WEIGHT` | 0.20 | `agency.rating` (0-5) normalise sur 0-100 ; 50 si absent. |
| Disponibilite / qualite (proxy) | `PQI_WEIGHT` | 0.15 | `agency.pqi_score` (deja 0-100, cf. `platform_core/scoring.py`) utilise tel quel comme proxy de disponibilite/serieux du profil ; 50 si absent. |

Les 10 (configurable) meilleures agences sont retournees, triees par
`matching_score` decroissant.

### 2. `success_prediction` (0-100) — score de compatibilite

Combine, avec des poids nommes `EXPERIENCE_WEIGHT` (0.5), `SP_RATING_WEIGHT`
(0.3) et `CLIENT_TRUST_WEIGHT` (0.2) :

- **Experience** : `agency.completed_projects` (nombre d'`Opportunity` au
  statut `Terminée` pour cette agence), sature a 100 a partir de 10 projets
  termines (`EXPERIENCE_SATURATION_PROJECTS`).
- **Avis clients** : meme normalisation que le facteur `rating` ci-dessus.
- **Confiance client** : `client_trust_score` (0-100) renvoye par
  `get_project_context`, calcule cote Frappe (`platform_core/scoring.py`,
  `compute_trust_score`).

Chaque agence renvoie aussi une liste `factors` de phrases lisibles
("Facteurs explicatifs", cahier §3.3 — transparence de l'IA), par exemple
`"6 projets similaires termines avec succes sur la plateforme"` ou
`"Score de confiance du client de 78/100"`.

## Deviation par rapport a `docs/INTEGRATION.md`

`get_project_context` (cote Frappe, `platform_core/api/matching.py`) ne
renvoie **pas** `price_range` dans les `AgencyService` candidats (seuls
`service_name`, `skills`, `tech_stack` sont exposes). Il est donc impossible
de comparer directement une fourchette de prix agence au budget du projet,
comme le suggerait la description initiale de la tache.

**Choix retenu** : le facteur budget utilise `annual_revenue` de l'agence
comme proxy de capacite financiere (ratio `annual_revenue / budget_max` du
projet), avec un poids reduit (`BUDGET_WEIGHT = 0.10`, le plus faible des
cinq facteurs) plutot que d'etre purement neutre — conformement a la
consigne "si `AgencyService` ne porte pas de donnee de prix fiable,
ponderer ce facteur plus faiblement ou le sauter proprement". Si le champ
`price_range` est ajoute plus tard cote Frappe et expose par
`get_project_context`, ce facteur devra etre revu pour l'utiliser
directement.

## Variables d'environnement (cf. `docs/INTEGRATION.md` §9)

| Variable | Description | Defaut local |
|---|---|---|
| `FRAPPE_URL` | Base URL de Frappe | `http://localhost:8000` |
| `INTERNAL_SERVICE_TOKEN` | Jeton `X-Internal-Token` envoye a Frappe | `dev-internal-token` |
| `MATCHING_SHORTLIST_SIZE` | Nombre d'agences retournees (optionnel) | `10` |

## Lancer en standalone

```bash
export FRAPPE_URL=http://localhost:8000
export INTERNAL_SERVICE_TOKEN=<jeton partage avec Frappe>
mvn spring-boot:run
```

Le service ecoute sur `http://localhost:8081`. Verifier avec :

```bash
curl http://localhost:8081/actuator/health
curl -X POST http://localhost:8081/api/matching/PROJ-0001/shortlist
```

## Build Docker

```bash
docker build -t matching-service .
docker run -p 8081:8081 \
  -e FRAPPE_URL=http://frappe:8000 \
  -e INTERNAL_SERVICE_TOKEN=<jeton> \
  matching-service
```

Build multi-stage : `maven:3.9-eclipse-temurin-21` pour compiler,
`eclipse-temurin:21-jre` (image runtime minimale) pour executer le jar.
