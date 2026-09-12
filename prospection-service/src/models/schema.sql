
CREATE TABLE IF NOT EXISTS visits (
    id                  BIGSERIAL PRIMARY KEY,
    agency              TEXT NOT NULL,              
    visitor_ip          TEXT,
    company_name        TEXT,
    company_domain      TEXT,
    visitor_location     TEXT,                        
    session_id          TEXT NOT NULL,
    client_email        TEXT,                        
    action               TEXT NOT NULL,              
    base_points         INTEGER NOT NULL DEFAULT 0,
    bonus_points        INTEGER NOT NULL DEFAULT 0,
    points              INTEGER NOT NULL DEFAULT 0,  
    duration_seconds    INTEGER,
    item_count          INTEGER,                     
    cumulative_score    INTEGER NOT NULL DEFAULT 0,   
    classification      TEXT NOT NULL DEFAULT 'Froid',
    ip_resolution_provider TEXT,                      
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_agency_session ON visits (agency, session_id);
CREATE INDEX IF NOT EXISTS idx_visits_agency_created ON visits (agency, created_at DESC);

CREATE TABLE IF NOT EXISTS leads (
    id                  BIGSERIAL PRIMARY KEY,
    agency              TEXT NOT NULL,
    session_id          TEXT NOT NULL,
    visitor_ip          TEXT,
    company_name        TEXT,
    company_domain      TEXT,
    visitor_location     TEXT,                        
    client_email        TEXT,                        
    client_name         TEXT,                        
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
    last_email_status   TEXT NOT NULL DEFAULT 'None', 
    last_email_sent_at  TIMESTAMPTZ,
    UNIQUE (agency, session_id)
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_status TEXT NOT NULL DEFAULT 'None';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_location TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_location TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_agency_classification ON leads (agency, classification);
CREATE INDEX IF NOT EXISTS idx_leads_agency_last_seen ON leads (agency, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS campaigns (
    id                  BIGSERIAL PRIMARY KEY,
    agency              TEXT NOT NULL,
    name                TEXT NOT NULL,
    channels            JSONB NOT NULL DEFAULT '[]',   
    target_lead_ids     JSONB NOT NULL DEFAULT '[]',   
    status              TEXT NOT NULL DEFAULT 'Draft', 
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_agency ON campaigns (agency);
