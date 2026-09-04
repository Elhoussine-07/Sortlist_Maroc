"use strict";

const express = require("express");
const db = require("../db");
const logger = require("../utils/logger");
const scoreCalculator = require("../services/scoreCalculator");
const ipDetector = require("../services/ipDetector");
const emailGenerator = require("../services/emailGenerator");
const emailSender = require("../services/emailSender");
const crmSync = require("../services/crmSync");
const frappeClient = require("../services/frappeClient");

const router = express.Router();

function clientIp(req, body) {
    if (body && body.ip) return String(body.ip);
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return String(forwarded).split(",")[0].trim();
    return req.socket?.remoteAddress || null;
}

function asyncHandler(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
}

const CLASSIFICATION_RANK = { Chaud: 3, "Tiède": 2, Froid: 1 };

/**
 * AJOUTÉ : `leads` est unique par (agency, session_id) — un même client
 * identifié (client_email connu) qui revient plusieurs fois (navigation
 * privée, navigateur différent, cache vidé...) génère une nouvelle session à
 * chaque fois, donc plusieurs lignes distinctes pour la même personne réelle
 * côté agence, qui perturbe le suivi de cible ("4 prospects" alors qu'il
 * s'agit peut-être d'un seul client testé plusieurs fois). On regroupe ici
 * les lignes qui partagent le même `client_email` (visiteur identifié) — les
 * visiteurs anonymes (détection IP uniquement, pas de client_email) restent
 * distincts, faute d'identité fiable pour les fusionner.
 */
function mergeLeadsByClientIdentity(rows) {
    const groups = new Map();
    for (const row of rows) {
        const key = row.client_email ? `client:${row.client_email}` : `session:${row.id}`;
        const existing = groups.get(key);
        if (!existing) {
            groups.set(key, { ...row, session_count: 1, actions: [...(row.actions || [])] });
            continue;
        }
        existing.session_count += 1;
        existing.visit_count = (existing.visit_count || 0) + (row.visit_count || 0);
        if (new Date(row.first_seen_at) < new Date(existing.first_seen_at)) {
            existing.first_seen_at = row.first_seen_at;
        }
        if (new Date(row.last_seen_at) > new Date(existing.last_seen_at)) {
            existing.last_seen_at = row.last_seen_at;
            existing.last_action = row.last_action;
            // Les actions de suivi (générer/envoyer un e-mail, voir l'activité)
            // ciblent la session la plus récente — la plus pertinente pour agir.
            existing.id = row.id;
            existing.session_id = row.session_id;
        }
        existing.cumulative_score = Math.max(existing.cumulative_score, row.cumulative_score);
        if (
            (CLASSIFICATION_RANK[row.classification] || 0) >
            (CLASSIFICATION_RANK[existing.classification] || 0)
        ) {
            existing.classification = row.classification;
        }
        existing.client_name = existing.client_name || row.client_name;
        existing.company_name = existing.company_name || row.company_name;
        existing.company_domain = existing.company_domain || row.company_domain;
        existing.location = existing.location || row.location;
        existing.visitor_ip = existing.visitor_ip || row.visitor_ip;
        for (const action of row.actions || []) {
            if (!existing.actions.includes(action)) existing.actions.push(action);
        }
    }
    return Array.from(groups.values()).sort(
        (a, b) => new Date(b.last_seen_at) - new Date(a.last_seen_at),
    );
}

/**
 * POST /api/prospection/track
 *
 * "Public-ish" tracking call fired by the frontend when a visitor performs a
 * trackable action on an agency's public profile page (§2.6 of the cahier
 * des charges). Deliberately does NOT require agency-scoped auth headers:
 * the caller here is an anonymous visitor browsing a public profile, not a
 * logged-in agency user — see README.md "Deviation notes" for why this
 * differs from the blanket "JWT requis, user_type=agency" row in
 * docs/INTEGRATION.md §5 for /api/prospection/**.
 */
/**
 * POST /api/prospection/visit
 *
 * AJOUTÉ (demande explicite) : compte une VRAIE visite du profil (un
 * chargement de page), découplé du scoring. Avant ce correctif,
 * `leads.visit_count` était incrémenté à CHAQUE appel `/track` — donc une
 * fois par onglet cliqué, pas une fois par visite (2-3 clics sur une même
 * visite gonflaient artificiellement le compteur à "×3 visites"). Cet
 * endpoint ne touche à AUCUN score/action — juste `visit_count`,
 * `first_seen_at`/`last_seen_at` et l'identité du visiteur si connu.
 * Appelé une seule fois au chargement du profil public (cf.
 * `agences_.$id.tsx`), jamais à chaque changement d'onglet.
 */
router.post(
    "/visit",
    asyncHandler(async (req, res) => {
        const body = req.body || {};
        const { agency, session_id: sessionId, client_email: clientEmail, client_name: clientName } = body;

        if (!agency || typeof agency !== "string") {
            return res.status(400).json({ error: "agency is required" });
        }
        if (!sessionId || typeof sessionId !== "string") {
            return res.status(400).json({ error: "session_id is required" });
        }

        await db.query(
            `insert into leads
             (agency, session_id, client_email, client_name, visit_count, first_seen_at, last_seen_at)
             values ($1,$2,$3,$4,1, now(), now())
                 on conflict (agency, session_id) do update set
                client_email = coalesce(excluded.client_email, leads.client_email),
                                                         client_name = coalesce(excluded.client_name, leads.client_name),
                                                         visit_count = leads.visit_count + 1,
                                                         last_seen_at = now()`,
            [agency, sessionId, clientEmail || null, clientName || null]
        );

        return res.json({ recorded: true });
    })
);

router.post(
    "/track",
    asyncHandler(async (req, res) => {
        const body = req.body || {};
        const {
            agency,
            session_id: sessionId,
            duration_seconds: durationSeconds,
            count,
            client_email: clientEmail,
            client_name: clientName,
        } = body;

        if (!agency || typeof agency !== "string") {
            return res.status(400).json({ error: "agency is required" });
        }
        if (!sessionId || typeof sessionId !== "string") {
            return res.status(400).json({ error: "session_id is required" });
        }

        const canonicalAction = scoreCalculator.normalizeAction(body.action);
        if (!canonicalAction) {
            return res.status(400).json({
                error: `Unknown action "${body.action}". Expected one of: ${scoreCalculator.ACTIONS.join(", ")}`,
            });
        }

        const ip = clientIp(req, body);
        const resolution = await ipDetector.resolveCompany(ip);

        const { basePoints, bonusApplies, bonusPoints, totalPoints } = await scoreCalculator.computePoints(
            canonicalAction,
            { duration_seconds: durationSeconds, count }
        );

        const windowDays = await scoreCalculator.getWindowDays();

        const priorSumResult = await db.query(
            `select coalesce(sum(points), 0)::int as total
             from visits
             where agency = $1 and session_id = $2 and created_at >= now() - ($3 || ' days')::interval`,
            [agency, sessionId, windowDays]
        );
        const priorSum = priorSumResult.rows[0]?.total || 0;
        // BUG CORRIGÉ : rien ne plafonnait le score cumulé — un visiteur actif
        // pouvait afficher "199/100", ce qui n'a aucun sens pour un score
        // présenté comme un pourcentage d'intention (§2.6.1). Le classement
        // chaud/tiède/froid reste basé sur le total réel (avant plafonnage) pour
        // ne pas fausser les seuils, mais la valeur stockée/affichée est bornée.
        const rawScore = priorSum + totalPoints;
        const cumulativeScore = Math.min(rawScore, 100);

        const classification = await scoreCalculator.classify(rawScore);

        const companyName = body.company_name || resolution.company_name;
        const companyDomain = body.company_domain || resolution.company_domain;
        // AJOUTÉ (demande explicite) : ipDetector.resolveCompany() calculait déjà
        // ville/pays (resolution.raw) mais ne les persistait jamais — /leads ne
        // sélectionnait donc aucun champ de localisation, d'où "Non spécifiée"
        // systématique côté UI. `resolution.raw` est absent pour une IP privée/
        // réservée ou un échec de résolution (cf. ipDetector.js::mockResolution).
        const visitorLocation = resolution.raw
            ? [resolution.raw.city, resolution.raw.country].filter(Boolean).join(", ") || null
            : null;

        await db.query(
            `insert into visits
             (agency, visitor_ip, company_name, company_domain, visitor_location, session_id, client_email, action,
              base_points, bonus_points, points, duration_seconds, item_count,
              cumulative_score, classification, ip_resolution_provider)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [
                agency,
                ip,
                companyName,
                companyDomain,
                visitorLocation,
                sessionId,
                clientEmail || null,
                canonicalAction,
                basePoints,
                bonusPoints,
                totalPoints,
                durationSeconds ?? null,
                count ?? null,
                cumulativeScore,
                classification,
                resolution.provider,
            ]
        );

        await db.query(
            `insert into leads
             (agency, session_id, visitor_ip, company_name, company_domain, visitor_location, client_email, client_name,
              cumulative_score, classification, last_action, visit_count, first_seen_at, last_seen_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1, now(), now())
                 on conflict (agency, session_id) do update set
                visitor_ip = excluded.visitor_ip,
                                                         company_name = coalesce(excluded.company_name, leads.company_name),
                                                         company_domain = coalesce(excluded.company_domain, leads.company_domain),
                                                         visitor_location = coalesce(excluded.visitor_location, leads.visitor_location),
                                                         -- Une fois un visiteur identifié (connecté), on garde son identité
                                                         -- même si une visite ultérieure du même navigateur redevient
                                                         -- anonyme (ex: déconnexion) — ne jamais "désidentifier" un lead.
                                                         client_email = coalesce(excluded.client_email, leads.client_email),
                                                         client_name = coalesce(excluded.client_name, leads.client_name),
                                                         cumulative_score = excluded.cumulative_score,
                                                         classification = excluded.classification,
                                                         last_action = excluded.last_action,
                                                         -- BUG CORRIGE (demande explicite) : visit_count n'est plus
                                                         -- incremente ici -- chaque appel /track correspond a une action
                                                         -- (un onglet clique), pas a une visite. Seul POST /visit (une
                                                         -- fois par chargement de page) incremente ce compteur desormais.
                                                         last_seen_at = now()`,
            [
                agency,
                sessionId,
                ip,
                companyName,
                companyDomain,
                visitorLocation,
                clientEmail || null,
                clientName || null,
                cumulativeScore,
                classification,
                canonicalAction,
            ]
        );

        // Best-effort mirror into Frappe's Agency Analytics dashboard. Our own
        // Postgres row above already persisted the authoritative record, so a
        // Frappe outage must not fail this request.
        frappeClient
            .logVisitor({
                agency,
                action: canonicalAction,
                visitor_ip: ip,
                company_name: companyName,
                company_domain: companyDomain,
                session_id: sessionId,
            })
            .catch((err) => {
                logger.warn("log_visitor mirror to Frappe failed (non-fatal)", { error: err.message, agency, sessionId });
            });

        return res.json({
            classification,
            cumulative_score: cumulativeScore,
            points_awarded: totalPoints,
            bonus_applied: bonusApplies,
            company_resolution: { provider: resolution.provider, confidence: resolution.confidence },
        });
    })
);

/**
 * GET /api/prospection/leads
 * Agency-scoped via X-Agency-Id (forwarded by the Gateway, cf.
 * docs/INTEGRATION.md §3). Filterable by classification and date range.
 */
router.get(
    "/leads",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }

        const { classification, from, to } = req.query;
        const clauses = ["agency = $1"];
        const params = [agencyId];

        if (classification) {
            const allowed = ["Chaud", "Tiède", "Froid"];
            const normalized = allowed.find((c) => c.toLowerCase() === String(classification).toLowerCase());
            if (!normalized) {
                return res.status(400).json({ error: `classification must be one of: ${allowed.join(", ")}` });
            }
            params.push(normalized);
            clauses.push(`classification = $${params.length}`);
        }
        if (from) {
            params.push(from);
            clauses.push(`last_seen_at >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            clauses.push(`last_seen_at <= $${params.length}`);
        }

        // BUG CORRIGÉ : cette requête ne sélectionnait jamais de champ "actions"
        // (seulement `last_action`, l'action la plus récente) — le frontend
        // attend un tableau `actions` pour la colonne "Signaux détectés", qui
        // restait donc toujours vide quel que soit le nombre réel de pages
        // consultées par le visiteur. Agrégation des actions distinctes
        // réellement enregistrées dans `visits` pour ce (agency, session_id).
        //
        // BUG CORRIGÉ (demande explicite) : cette agrégation remontait TOUT
        // l'historique de `visits` depuis toujours, sans aucune limite de temps
        // — incohérent avec `cumulative_score`, qui lui est calculé uniquement
        // sur la fenêtre glissante `window_days` (cf. `/track` et
        // scoreCalculator.getWindowDays()). Un visiteur ayant consulté 2 onglets
        // aujourd'hui pouvait donc voir s'afficher des signaux vieux de
        // plusieurs semaines/mois (tests précédents, anciens comportements),
        // le score et les "signaux détectés" affichés étant construits sur deux
        // périmètres temporels différents. Même fenêtre appliquée aux deux
        // désormais : les actions plus vieilles que `window_days` sortent
        // naturellement de l'affichage, sans purge manuelle de la base.
        const windowDays = await scoreCalculator.getWindowDays();
        params.push(windowDays);
        const windowParamIndex = params.length;

        const result = await db.query(
            `select l.id, l.agency, l.session_id, l.visitor_ip, l.company_name, l.company_domain,
                    l.visitor_location as location,
                    l.client_email, l.client_name,
                    l.cumulative_score, l.classification, l.last_action, l.visit_count,
                    l.first_seen_at, l.last_seen_at,
                    coalesce(
                            (select array_agg(distinct v.action order by v.action)
                             from visits v
                             where v.agency = l.agency and v.session_id = l.session_id
                               and v.created_at >= now() - ($${windowParamIndex} || ' days')::interval),
                array[]::text[]
              ) as actions
             from leads l
             where ${clauses.join(" and ")}
             order by l.last_seen_at desc
                 limit 500`,
            params
        );

        return res.json({ leads: mergeLeadsByClientIdentity(result.rows) });
    })
);

/**
 * GET /api/prospection/leads/:id/activity
 *
 * Détail chronologique des visites d'un lead (§2.6 : "suivi des mouvements
 * du client sur le profil agence") — chaque action trackée avec sa durée et
 * le nombre d'éléments consultés, pour que l'agence voie concrètement
 * "combien de temps le prospect a passé sur telle section", pas seulement
 * un score agrégé.
 */
router.get(
    "/leads/:id/activity",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }

        const leadResult = await db.query(`select * from leads where id = $1 and agency = $2`, [
            req.params.id,
            agencyId,
        ]);
        const lead = leadResult.rows[0];
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        const visitsResult = await db.query(
            `select action, duration_seconds, item_count, points, created_at
             from visits
             where agency = $1 and session_id = $2
             order by created_at desc
                 limit 200`,
            [lead.agency, lead.session_id]
        );

        return res.json({ lead_id: lead.id, visits: visitsResult.rows });
    })
);

/**
 * POST /api/prospection/leads/:id/generate-email
 */
router.post(
    "/leads/:id/generate-email",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }

        const leadResult = await db.query(`select * from leads where id = $1 and agency = $2`, [
            req.params.id,
            agencyId,
        ]);
        const lead = leadResult.rows[0];
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        const draft = await emailGenerator.generateEmail(lead);

        await db.query(
            `update leads set last_email_subject = $1, last_email_body = $2,
                              last_email_provider = $3, last_email_generated_at = now(),
                              last_email_status = 'Draft'
             where id = $4`,
            [draft.subject, draft.body, draft.provider, lead.id]
        );

        return res.json({ lead_id: lead.id, draft });
    })
);

const EMAIL_SHAPE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AJOUTÉ (demande explicite, point 2) : seule `lead.client_email` (visiteur
 * identifié — connecté en tant que client au moment du tracking) est une
 * adresse email vérifiable. `company_domain`/`company_name` (deviné par
 * détection IP, cf. ipDetector.js) ne sont PAS des adresses email — les
 * utiliser comme destinataire (comportement précédent) produisait un envoi
 * qui semblait réussir mais ne pouvait jamais atteindre personne.
 *
 * Point d'extension pour une future recherche d'email professionnel (ex.
 * Hunter.io/Clearbit à partir de `company_domain`) pour les leads détectés
 * uniquement par IP : brancher cette résolution ICI, en gardant le contrat
 * `{ email: string|null, source: string }` pour que l'appelant sache d'où
 * vient l'adresse trouvée.
 */
function resolveRecipientEmail(lead) {
    if (lead.client_email && EMAIL_SHAPE_RE.test(lead.client_email)) {
        return { email: lead.client_email, source: "client_email" };
    }
    return { email: null, source: null };
}

/**
 * POST /api/prospection/leads/:id/send-email
 *
 * Sends the outreach email to a lead. Accepts an explicit `{subject, body}`
 * in the request body; if omitted, reuses the last draft generated via
 * POST /leads/:id/generate-email (lead.last_email_subject/last_email_body).
 *
 * AJOUTÉ (demande explicite) :
 * - 422 si aucune adresse email vérifiable n'est disponible pour ce lead
 *   (cf. resolveRecipientEmail) — plutôt que d'envoyer silencieusement vers
 *   un nom de domaine/société qui n'a jamais reçu quoi que ce soit.
 * - `last_email_status` ne passe à 'Sent' QUE si le transport SMTP a
 *   réellement confirmé l'envoi (`emailSender.sendEmail` -> `sent: true`,
 *   cf. services/emailSender.js) ; sinon 'Failed', jamais 'Sent' pour un
 *   envoi simulé ou en échec (point 4 — l'UI agence ne doit plus jamais
 *   afficher "envoyé" pour quelque chose qui ne l'a pas été).
 */
router.post(
    "/leads/:id/send-email",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }

        const leadResult = await db.query(`select * from leads where id = $1 and agency = $2`, [
            req.params.id,
            agencyId,
        ]);
        const lead = leadResult.rows[0];
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        const { subject: bodySubject, body: bodyText } = req.body || {};
        const subject = bodySubject || lead.last_email_subject;
        const body = bodyText || lead.last_email_body;

        if (!subject || !body) {
            return res.status(400).json({
                error:
                    "No email content to send: provide { subject, body } in the request, " +
                    "or generate a draft first via POST /leads/:id/generate-email",
            });
        }

        const recipient = resolveRecipientEmail(lead);
        if (!recipient.email) {
            return res.status(422).json({
                error:
                    "Ce lead n'a pas d'adresse email vérifiée (visiteur non identifié — détection IP " +
                    "uniquement) : impossible d'envoyer un email réel. Le brouillon reste disponible " +
                    "(last_email_subject/last_email_body) pour un contact manuel.",
                sent: false,
                lead_id: lead.id,
            });
        }

        let result;
        let status = "Failed";
        try {
            result = await emailSender.sendEmail({ to: recipient.email, subject, body });
            status = result.sent ? "Sent" : "Failed";
        } catch (err) {
            logger.warn("emailSender.sendEmail threw — marking send as Failed", {
                error: err.message,
                leadId: lead.id,
            });
            result = { provider: "smtp", sent: false, sent_on: new Date().toISOString(), note: err.message };
        }

        await db.query(
            `update leads set last_email_subject = $1, last_email_body = $2,
                              last_email_status = $3, last_email_sent_at = case when $3 = 'Sent' then $4 else last_email_sent_at end
             where id = $5`,
            [subject, body, status, result.sent_on, lead.id],
        );

        // Notification IN-APP + EMAIL réelle (frappe.sendmail, cf. notify.py) au
        // client identifié — reprend désormais le contenu réel envoyé (subject/
        // body) au lieu d'un texte générique déconnecté (point 3). Best-effort :
        // un échec réseau ne doit jamais faire échouer la réponse de cet
        // endpoint, dont le statut reflète déjà fidèlement l'envoi SMTP.
        frappeClient
            .notifyClientInterest({ client_email: recipient.email, agency: lead.agency, subject, body })
            .catch((err) => {
                logger.warn("notify_client_interest failed (non-fatal)", {
                    error: err.message,
                    leadId: lead.id,
                });
            });

        return res.json({
            sent: result.sent,
            sent_on: result.sent_on,
            provider: result.provider,
            note: result.note,
            lead_id: lead.id,
        });
    })
);

/**
 * GET /api/prospection/campaigns
 * POST /api/prospection/campaigns
 * Minimal CRUD for the SHOULD-priority "campagnes multicanales" feature.
 * GET supports an optional `?status=` filter (campaigns.status, cf.
 * models/schema.sql: Draft | Active | Paused | Completed).
 */
router.get(
    "/campaigns",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }

        const { status } = req.query;
        const clauses = ["agency = $1"];
        const params = [agencyId];

        if (status) {
            const allowed = ["Draft", "Active", "Paused", "Completed"];
            const normalized = allowed.find((s) => s.toLowerCase() === String(status).toLowerCase());
            if (!normalized) {
                return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
            }
            params.push(normalized);
            clauses.push(`status = $${params.length}`);
        }

        const result = await db.query(
            `select id, agency, name, channels, target_lead_ids, status, created_at, updated_at
             from campaigns where ${clauses.join(" and ")} order by created_at desc`,
            params
        );
        return res.json({ campaigns: result.rows });
    })
);

router.post(
    "/campaigns",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }

        const { name, channels, target_lead_ids: targetLeadIds, status } = req.body || {};
        if (!name || typeof name !== "string") {
            return res.status(400).json({ error: "name is required" });
        }

        const result = await db.query(
            `insert into campaigns (agency, name, channels, target_lead_ids, status)
             values ($1, $2, $3::jsonb, $4::jsonb, coalesce($5, 'Draft'))
                 returning id, agency, name, channels, target_lead_ids, status, created_at, updated_at`,
            [agencyId, name, JSON.stringify(channels || []), JSON.stringify(targetLeadIds || []), status || null]
        );

        return res.status(201).json({ campaign: result.rows[0] });
    })
);

/**
 * (Bonus, not explicitly required by the task but a natural fit for the
 * "Synchronisation CRM" SHOULD feature) — exposed so the pluggable crmSync
 * interface is actually reachable from the API surface.
 */
router.post(
    "/leads/:id/crm-export",
    asyncHandler(async (req, res) => {
        const agencyId = req.headers["x-agency-id"];
        if (!agencyId) {
            return res.status(400).json({ error: "X-Agency-Id header is required" });
        }
        const leadResult = await db.query(`select * from leads where id = $1 and agency = $2`, [
            req.params.id,
            agencyId,
        ]);
        const lead = leadResult.rows[0];
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }
        const result = await crmSync.exportLead(lead, req.body?.provider);
        return res.json(result);
    })
);

module.exports = router;