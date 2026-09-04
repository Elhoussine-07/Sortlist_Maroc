-- prospection-service — Postgres schema (db `prospection`, cf. docs/INTEGRATION.md §2)
--
-- prospection-service is the source of truth for full visit history (the
-- `visits` table below). Frappe's VisitorLog doctype only receives a mirrored
-- summary via log_visitor (§6) for display in the Agency dashboard.

CREATE TABLE IF NOT EXISTS visits (
    id                  BIGSERIAL PRIMARY KEY,
    agency              TEXT NOT NULL,              -- AgencyProfile.name (e.g. AGENCY-0001)
    visitor_ip          TEXT,
    company_name        TEXT,
    company_domain      TEXT,
    visitor_location     TEXT,                        -- "Ville, Pays" résolu par ipDetector.js (cf. resolveCompany().raw)
    session_id          TEXT NOT NULL,
    client_email        TEXT,                        -- identité du visiteur si connecté en tant que client
    action               TEXT NOT NULL,              -- canonical French label (LeadScoringRule.action)
    base_points         INTEGER NOT NULL DEFAULT 0,
    bonus_points        INTEGER NOT NULL DEFAULT 0,
    points              INTEGER NOT NULL DEFAULT 0,  -- base_points + bonus_points for this event
    duration_seconds    INTEGER,
    item_count          INTEGER,                     -- projects / reviews / members / certifications viewed
    cumulative_score    INTEGER NOT NULL DEFAULT 0,   -- running score for (agency, session_id) at event time
    classification      TEXT NOT NULL DEFAULT 'Froid',-- Froid | Tiède | Chaud, at event time
    ip_resolution_provider TEXT,                      -- which ipDetector backend resolved company_name/domain
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_agency_session ON visits (agency, session_id);
CREATE INDEX IF NOT EXISTS idx_visits_agency_created ON visits (agency, created_at DESC);

-- One row per (agency, session_id): the current aggregate state of a
-- detected visitor/lead, upserted on every /track call. This is what
-- GET /api/prospection/leads reads from.
CREATE TABLE IF NOT EXISTS leads (
    id                  BIGSERIAL PRIMARY KEY,
    agency              TEXT NOT NULL,
    session_id          TEXT NOT NULL,
    visitor_ip          TEXT,
    company_name        TEXT,
    company_domain      TEXT,
    visitor_location     TEXT,                        -- "Ville, Pays" résolu par ipDetector.js
    client_email        TEXT,                        -- identité résolue (visiteur connecté en tant que client)
    client_name         TEXT,                        -- nom affiché du client identifié (jamais de coordonnées)
    cumulative_score    INTEGER NOT NULL DEFAULT 0,
    classification      TEXT NOT NULL DEFAULT 'Froid',
    last_action         TEXT,
    visit_count         INTEGER NOT NULL DEFAULT 0,
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_email_subject  TEXT,
    last_email_body     TEXT,
    last_email_provider TEXT,
    last_email_generated_at TIMESTAMPTZ,
    last_email_status   TEXT NOT NULL DEFAULT 'None', -- None | Draft | Sent | Failed (cf. routes/prospection.js /send-email)
    last_email_sent_at  TIMESTAMPTZ,
    UNIQUE (agency, session_id)
);

-- Columns above are included in the CREATE TABLE for fresh installs; the
-- ALTER statements below cover databases that were migrated before
-- last_email_status/last_email_sent_at existed (CREATE TABLE IF NOT EXISTS
-- is a no-op once the table already exists, cf. models/migrate.js).
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_status TEXT NOT NULL DEFAULT 'None';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_location TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_location TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_agency_classification ON leads (agency, classification);
CREATE INDEX IF NOT EXISTS idx_leads_agency_last_seen ON leads (agency, last_seen_at DESC);

-- Minimal CRUD for the SHOULD-priority "campagnes multicanales" feature
-- (cahier des charges 2.6, "Campagnes multicanales" / "Relances automatisées").
-- Kept intentionally simple — no scheduling engine, just enough structure to
-- store what the frontend needs to render a campaign list/detail.
CREATE TABLE IF NOT EXISTS campaigns (
    id                  BIGSERIAL PRIMARY KEY,
    agency              TEXT NOT NULL,
    name                TEXT NOT NULL,
    channels            JSONB NOT NULL DEFAULT '[]',   -- e.g. ["email", "linkedin"]
    target_lead_ids     JSONB NOT NULL DEFAULT '[]',   -- array of leads.id
    status              TEXT NOT NULL DEFAULT 'Draft', -- Draft | Active | Paused | Completed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_agency ON campaigns (agency);
