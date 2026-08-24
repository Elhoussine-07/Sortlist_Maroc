# Bascule automatique Frappe conteneur/local

Frappe (`platform_core`) peut tourner de deux façons différentes selon
l'environnement :

- **en conteneur** : service `frappe` du `docker-compose.yml` (racine du
  dépôt), joignable depuis le réseau Docker interne sous le nom
  `frappe:8000` — actuellement **commenté** dans `docker-compose.yml` (voir
  la section "Cœur métier - FRAPPE") ;
- **en local sur l'hôte Docker** : `bench start` lancé directement sur la
  machine hôte, joignable depuis les conteneurs via
  `host.docker.internal:8000` (grâce à `extra_hosts:
  host.docker.internal:host-gateway` sur chaque service).

Aucun des quatre clients Frappe du monorepo (`matching-service`,
`ia-service`, `prospection-service`, `api-gateway`) ne code en dur lequel
des deux modes est actif : chacun **essaie d'abord l'URL "conteneur"**, et
**bascule automatiquement sur l'URL "locale"** si celle-ci ne répond pas.

## Comment ça marche

Pour chaque appel à Frappe (ou, côté `api-gateway`, pour chaque requête
routée vers Frappe) :

1. Si `FRAPPE_URL` est **explicitement définie** (non vide) → elle est
   utilisée telle quelle, sans aucune sonde. La bascule automatique est
   entièrement désactivée. C'est le seul mode où le service "sait" où est
   Frappe à l'avance — pratique pour forcer une valeur en debug ou dans un
   environnement où le conteneur/local n'a pas de sens (ex: CI).
2. Sinon, le service consulte un **cache court (~45s)** du dernier choix qui
   a fonctionné. Si le cache est encore frais, il est réutilisé sans sonder
   Frappe à nouveau (évite de sonder à chaque requête).
3. Si le cache est absent ou périmé, le service **sonde** `FRAPPE_URL_CONTAINER`
   avec une requête HTTP courte (timeout ~1.5s) sur
   `GET /api/method/platform_core.platform_core.api.utils.ping` — une
   méthode Frappe publique (`allow_guest=True`, cf. `docs/INTEGRATION.md
   §5`), donc la sonde ne nécessite ni JWT ni jeton de service.
   - Si la sonde répond (y compris avec un code 4xx — l'important est que
     *quelque chose* réponde à cette adresse), cette URL est retenue et mise
     en cache.
   - Sinon (connexion refusée, timeout, DNS introuvable...), le service
     sonde `FRAPPE_URL_LOCAL` de la même façon.
   - Si les deux sondes échouent, le service réutilise le dernier choix
     connu (même périmé) s'il existe, sinon retombe par défaut sur l'URL
     "conteneur". Dans ce cas, le cache **n'est pas rafraîchi** : le prochain
     appel retente une sonde immédiatement, au lieu de rester bloqué ~45s de
     plus sur un échec.
4. L'appel HTTP réel (vers `get_project_context`, `get_categories`,
   `log_visitor`, etc., ou la requête proxyée par le Gateway) part ensuite
   vers l'URL résolue à l'étape 2/3.

Ce mécanisme garantit qu'un changement de mode en cours de route (Frappe
qu'on démarre en conteneur alors qu'il tournait en local, ou l'inverse) est
détecté **au plus tard ~45s** après le changement, sans jamais nécessiter de
redémarrer les microservices.

## Implémentation par service

| Service | Fichier(s) | Notes |
|---|---|---|
| `matching-service` | `src/main/java/com/platform/matching/client/FrappeUrlResolver.java` (+ `FrappeClient.java`, `config/FrappeProperties.java`, `config/WebConfig.java`) | Sonde bloquante via `java.net.http.HttpClient` (timeout dédié), cache protégé par `synchronized` |
| `ia-service` | `app/frappe_client.py` (`resolve_frappe_url()`) | Sonde asynchrone via `httpx`, cache protégé par un `asyncio.Lock` |
| `prospection-service` | `src/services/frappeClient.js` (`resolveFrappeUrl()`) | Sonde via `fetch`/`AbortController` (même pattern que les appels normaux), résolutions concurrentes coalescées dans une seule Promise en vol |
| `api-gateway` | `src/main/java/com/platform/gateway/config/FrappeUrlResolver.java` + `src/main/java/com/platform/gateway/filter/FrappeDynamicRoutingFilter.java` | Voir "Cas particulier api-gateway" ci-dessous — implémentation non-bloquante (`WebClient`/`Mono`), **volontairement distincte** de celle de `matching-service` (les deux services Java ne partagent pas de module commun ici) |

## Cas particulier : `api-gateway` (Spring Cloud Gateway)

`GatewayConfig` route déjà `/api/method/**`, `/api/resource/**`, `/files/**`
et `/private/files/**` vers Frappe. Une route Spring Cloud Gateway classique
(`.route("frappe", r -> r.path(...).uri(uneUriFixe))`) résout son URI **une
seule fois**, à la construction du bean `RouteLocator` — elle n'est pas
ré-évaluée à chaque requête. Impossible donc de simplement passer une
`Supplier<URI>` à `.uri(...)` (ce builder n'accepte qu'une `URI`/`String`
concrète), et une route statique ne peut donc pas, à elle seule, suivre une
bascule conteneur/local qui change en cours de vie du processus.

La solution retenue : un `GlobalFilter`
(`FrappeDynamicRoutingFilter`) qui s'exécute juste après le filtre interne
`RouteToRequestUrlFilter` de Spring Cloud Gateway (celui qui fusionne l'URI
statique de la route avec le chemin/la query de la requête entrante) et qui,
uniquement pour la route `"frappe"`, **réécrit** le schéma/hôte/port de
l'attribut d'échange `GATEWAY_REQUEST_URL_ATTR` avec l'URL que
`FrappeUrlResolver` résout *pour cette requête*, en conservant le chemin et
la query déjà fusionnés. La route déclarée dans `GatewayConfig` garde donc
une URI statique, mais celle-ci n'est plus qu'un **placeholder syntaxique**
(elle doit juste être une URI valide pour que la construction du
`RouteLocator` réussisse) — elle n'est jamais réellement utilisée pour
router du trafic réel.

Alternative envisagée et écartée : une URI `lb://frappe-dynamic` combinée à
un `ReactorLoadBalancer` personnalisé (mécanisme standard de Spring Cloud
pour choisir une cible par requête). Cela fonctionne, mais importe tout le
module `spring-cloud-loadbalancer` et son abstraction "service
registry"/"instance list" pour un besoin qui se résume à "essaie A, sinon
B, avec un court cache" — le `GlobalFilter` ci-dessus offre le même résultat
avec beaucoup moins de machinerie.

Le résolveur `api-gateway` (`config/FrappeUrlResolver.java`) est une
réimplémentation simplifiée et **non-bloquante** (`WebClient` + `Mono`) de
la logique de `matching-service` : le Gateway tourne sur les threads
event-loop de Reactor Netty, donc sonder Frappe ne doit jamais bloquer un
thread. Le cache TTL est obtenu "gratuitement" via l'opérateur Reactor
`Mono#cache(Duration)`, qui re-souscrit automatiquement à la logique de
sonde après expiration.

## Configuration

| Variable | Défaut | Description |
|---|---|---|
| `FRAPPE_URL` | *(absente)* | Override explicite optionnel. Si définie (non vide), désactive la bascule automatique et fige l'URL Frappe utilisée par le service. |
| `FRAPPE_URL_CONTAINER` | `http://frappe:8000` | URL essayée en premier. |
| `FRAPPE_URL_LOCAL` | `http://host.docker.internal:8000` | URL de repli si `FRAPPE_URL_CONTAINER` ne répond pas. |

Ces variables sont définies dans `.env.example` (racine du dépôt) et
injectées à chacun des quatre services concernés dans `docker-compose.yml`.
Elles n'ont volontairement **pas** de valeur fixée en dur dans le compose
au-delà de ces défauts : le comportement "essaie conteneur, puis local" est
entièrement porté par le code de chaque service, pas par l'orchestration.

Timeouts et durée du cache sont volontairement courts et non exposés en
variable d'environnement pour rester simples (sonde ~1.5s, cache ~45s) ; les
ajuster nécessite une modification du code des résolveurs listés ci-dessus
si un besoin réel se présente.
