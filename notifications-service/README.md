# notifications-service

Thin real-time relay (Node.js + Express + Socket.IO) for the B2B marketplace
platform's notifications. **This service is not the source of truth for
notification history** — that's the `Notification` doctype in the Frappe app
(`platform_core/`, module 7 "Historique des notifications"). Frappe persists
every notification and calls this service to also push it live to whichever
browser tab(s)/device(s) the recipient currently has open. If nobody is
connected, that's a normal no-op — the user will see the notification next
time they load the app.

See `docs/INTEGRATION.md` (repo root) for the full contract this service
implements — §3 (JWT), §4 (internal service token), §5 (Gateway routing),
§6 (Frappe → notifications-service), §9 (env vars).

## Run standalone

```bash
cd notifications-service
npm install
npm start          # listens on :8085 (or $PORT)
```

Syntax-check every file without starting the server:

```bash
npm run check
```

## Environment variables

| Variable | Default (dev only) | Purpose |
|---|---|---|
| `PORT` | `8085` | HTTP + Socket.IO port |
| `JWT_SECRET` | `dev-insecure-secret-change-me` | HS256 secret shared with the Gateway and Frappe — used to verify Socket.IO connection tokens |
| `INTERNAL_SERVICE_TOKEN` | `dev-insecure-internal-token` | Must match the `X-Internal-Token` header Frappe sends to `POST /internal/notify` |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin (both the Express app and the Socket.IO server) |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Optional — only used by the `lead.hot` consumer, see below |
| `DISABLE_LEAD_HOT_CONSUMER` | unset | Set to `true` to skip starting the RabbitMQ consumer entirely |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | unset | Optional, see "Email" below — leave `SMTP_HOST` unset to keep email fully disabled |

The `JWT_SECRET` / `INTERNAL_SERVICE_TOKEN` defaults intentionally match the
fallback literals used in `platform_core/platform_core/auth.py`, so a
from-scratch dev environment with no `.env` file still works end-to-end
across Frappe and this service. **Never rely on these defaults outside of
local dev.**

## HTTP API

### `GET /health`
No auth. Returns `200` with the current connected-socket count. Used for
the `docker-compose` healthcheck (per `docs/INTEGRATION.md` §10).

### `POST /internal/notify`
Called by Frappe (never the other way around), `after_insert` on the
`Notification` doctype.

Header: `X-Internal-Token: <INTERNAL_SERVICE_TOKEN>` — `401` if missing or
wrong.

Body:
```json
{
  "recipient_email": "user@example.com",
  "type": "Statut projet",
  "title": "Votre projet a changé de statut",
  "body": "Le projet X est passé en cours",
  "link": "/projects/X",
  "notification_id": "NOTIF-0001"
}
```

Emits a `notification` Socket.IO event with this exact payload to every
socket the recipient currently has open (a user can have several — multiple
tabs/devices). Always responds `200`, even if nobody is connected:

```json
{ "delivered": true, "connected_sockets": 2 }
```

`delivered: false` just means nobody was connected at that moment — not an
error. Frappe already persisted the notification; this is a "live badge
update" nice-to-have on top.

## Socket.IO — frontend integration

Connect with the JWT issued by Frappe login/OTP, as a query param (matches
the Gateway's routing rule for `/socket.io/**` in `docs/INTEGRATION.md` §5):

```js
import { io } from "socket.io-client";

const socket = io(NOTIFICATIONS_URL, {
  query: { token: jwt },
  // `auth: { token: jwt }` is also accepted, if you prefer that style.
});

socket.on("notification", (payload) => {
  // payload: { recipient_email, type, title, body, link, notification_id }
  // update the notification badge / active list (module 7.1) in real time
});

socket.on("connect_error", (err) => {
  // token missing/invalid/expired — re-authenticate (no refresh token in
  // this iteration per docs/INTEGRATION.md §3, re-login on expiry)
});
```

On connect, the server verifies the JWT itself (HS256, `JWT_SECRET`) — this
is the one place in the platform where a service must decode the JWT
directly instead of trusting Gateway-injected headers, because Socket.IO
connections don't carry `X-User-*` headers the way proxied HTTP requests
do. The socket is then joined to a room named after `claims.sub` (the
user's email), so `io.to(email).emit(...)` reaches every device/tab for
that user.

## Optional polish: `lead.hot` RabbitMQ consumer

`src/services/notificationService.js` optionally starts an `amqplib`
consumer on a `lead.hot` queue (`RABBITMQ_URL`) at startup, as a concrete
use of the RabbitMQ container declared for the monorepo. This is **not**
part of the `docs/INTEGRATION.md` contract — no other service currently
publishes to this queue, it's provided as a working example of how
prospection-service (or anything else) could turn a "hot lead detected"
event into a live notification for an agency user without going through
Frappe at all.

Expected message body (JSON, our own convention — nothing else defines one
yet):
```json
{ "recipient_email": "agency-user@example.com", "title": "...", "body": "...", "link": "...", "notification_id": "..." }
```

It fails soft: if RabbitMQ isn't reachable at startup, the service logs a
warning and continues running normally — the core HTTP → Socket.IO relay
never depends on it. Set `DISABLE_LEAD_HOT_CONSUMER=true` to skip it
outright (e.g. in tests).

## Email — do not double-send

`src/services/emailService.js` is a lightweight `nodemailer` wrapper kept
**only for parity** with the target architecture diagram, which shows an
`emailService` next to `notificationService` inside this box. It is **not**
wired into `POST /internal/notify`.

Frappe already sends its own emails for `"Email"` / `"Both"` channel
notifications via `frappe.sendmail` (`docs/INTEGRATION.md` §6). If this
module were called from the `/internal/notify` path too, every such
notification would be sent twice. It's disabled by default (no-op) unless
`SMTP_HOST` is set, and is meant only as a building block for something
this service originates itself (e.g. an email tied to a `lead.hot` event
handled entirely here) — not as a general notification channel.

## Docker

```bash
docker build -t notifications-service .
docker run -p 8085:8085 \
  -e JWT_SECRET=... \
  -e INTERNAL_SERVICE_TOKEN=... \
  -e FRONTEND_URL=http://localhost:3000 \
  notifications-service
```

`node:22-slim`, `npm ci`, `EXPOSE 8085`. No database — this service is
stateless beyond its in-memory connection registry (which is expected: if
the process restarts, clients reconnect and rejoin their room
automatically).
