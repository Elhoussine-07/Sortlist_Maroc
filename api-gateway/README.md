# api-gateway

Spring Cloud Gateway (reactive, Java 21) — single entry point the frontend
uses to reach every backend microservice of the `platform_core` monorepo.

See [`/docs/INTEGRATION.md`](../docs/INTEGRATION.md) for the full
integration contract this service implements: routing table (§5), JWT
format (§3), and environment variables (§9). This README only covers how to
run the gateway itself; it does not restate the contract.

## What it does

- Routes requests by path prefix to Frappe, `matching-service`,
  `ia-service`, `prospection-service`, and (websocket passthrough)
  `notifications-service` — no path rewriting, pure passthrough.
- Validates the shared HS256 JWT (`Authorization: Bearer <jwt>`) on every
  route except the public Frappe routes listed in `/docs/INTEGRATION.md` §5
  and `/actuator/health`. Invalid/expired token → `401`.
- Injects `X-User-Email`, `X-User-Type`, `X-Agency-Id` headers (decoded
  from the JWT claims `sub`, `user_type`, `agency_id`) before forwarding, so
  downstream services don't need to re-decode the token.
- Enforces `user_type=agency` on `/api/prospection/**`.
- Lets `/socket.io/**` through without Bearer validation (Socket.IO carries
  its token as a query param; `notifications-service` validates it itself)
  and proxies it as a websocket route.
- Exposes `GET /actuator/health` (no auth) for `docker-compose` healthchecks.

## Running standalone

Requires Java 21 and Maven.

```bash
cd api-gateway

# Minimal — every downstream env var falls back to the Docker service name
# defaults from /docs/INTEGRATION.md §9, and JWT_SECRET falls back to the
# same dev literal Frappe uses, so this works out of the box against
# services reachable at those default URLs.
mvn spring-boot:run
```

To point at services running directly on your host instead of Docker
service names, use the `dev` Spring profile (see
`src/main/resources/application-dev.yml`), which defaults every service URL
to `localhost` instead:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Override any of these env vars as needed (all documented in
`/docs/INTEGRATION.md` §9):

| Variable | Purpose | Default |
|---|---|---|
| `JWT_SECRET` | HS256 secret shared with Frappe and every service | `dev-insecure-secret-change-me` |
| `FRAPPE_URL` | Frappe base URL | `http://frappe:8000` |
| `MATCHING_URL` | matching-service base URL | `http://matching-service:8081` |
| `IA_URL` | ia-service base URL | `http://ia-service:8083` |
| `PROSPECTION_URL` | prospection-service base URL | `http://prospection-service:8084` |
| `NOTIFICATIONS_URL` | notifications-service base URL (also used for the `/socket.io/**` ws route) | `http://notifications-service:8085` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

Example, running everything on localhost with non-default ports:

```bash
JWT_SECRET=dev-insecure-secret-change-me \
FRAPPE_URL=http://localhost:8000 \
MATCHING_URL=http://localhost:8081 \
IA_URL=http://localhost:8083 \
PROSPECTION_URL=http://localhost:8084 \
NOTIFICATIONS_URL=http://localhost:8085 \
FRONTEND_URL=http://localhost:3000 \
mvn spring-boot:run
```

The gateway listens on `8080` (`server.port`, not configurable via env var —
matches the fixed port table in `/docs/INTEGRATION.md` §2).

### Build / verify

```bash
mvn -q compile     # compile only
mvn -q package      # build the jar (src/test is minimal, no external deps needed)
```

## Running via Docker

```bash
docker build -t api-gateway .
docker run -p 8080:8080 \
  -e JWT_SECRET=... \
  -e FRAPPE_URL=http://frappe:8000 \
  -e MATCHING_URL=http://matching-service:8081 \
  -e IA_URL=http://ia-service:8083 \
  -e PROSPECTION_URL=http://prospection-service:8084 \
  -e NOTIFICATIONS_URL=http://notifications-service:8085 \
  -e FRONTEND_URL=http://localhost:3000 \
  api-gateway
```

## How it fits in the monorepo

`api-gateway/` is one of the sibling service folders at the repo root (see
`/docs/INTEGRATION.md` §1). It is the **only** service the frontend talks to
directly for HTTP APIs (it also talks directly to `notifications-service`
for Socket.IO, per §2). It has no database and no business logic of its own
— its only jobs are JWT enforcement, header injection, and passthrough
routing to the services that do own the business logic (Frappe first and
foremost, plus matching/ia/prospection). When `infrastructure/docker-compose.yml`
is added, this service should be wired in with the env vars above pointing
at the other services' Docker Compose hostnames, and a healthcheck against
`GET /actuator/health`.

## Project layout

```
api-gateway/
├── src/main/java/com/platform/gateway/
│   ├── GatewayApplication.java          entry point
│   ├── config/GatewayConfig.java        route table (§5)
│   ├── config/CorsConfig.java           CORS open to FRONTEND_URL
│   ├── filter/AuthenticationFilter.java JWT enforcement + header injection
│   └── util/JwtUtil.java                HS256 verify (PyJWT-compatible)
├── src/main/resources/application.yml
├── src/main/resources/application-dev.yml
├── pom.xml
├── Dockerfile
└── README.md
```
