-- Migration 001: Initial schema for ChartSaathi
-- Run via Supabase dashboard SQL editor or supabase CLI

-- ─── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Trains ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trains (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_number VARCHAR(6) UNIQUE NOT NULL,
  train_name   TEXT NOT NULL,
  source_code  VARCHAR(7),
  source_name  TEXT,
  dest_code    VARCHAR(7),
  dest_name    TEXT,
  source_meta  JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trains_number ON trains(train_number);
CREATE INDEX IF NOT EXISTS idx_trains_name ON trains USING GIN (to_tsvector('english', train_name));

-- ─── Stations ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(7) UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(code);

-- ─── Chart snapshots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chart_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_number    VARCHAR(6) NOT NULL,
  journey_date    DATE NOT NULL,
  class_code      VARCHAR(3),
  boarding_station VARCHAR(7) NOT NULL,
  dest_station    VARCHAR(7) NOT NULL,
  chart_status    VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
  provider        VARCHAR(50) NOT NULL DEFAULT 'mock',
  is_demo         BOOLEAN NOT NULL DEFAULT TRUE,
  raw_payload     JSONB,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  CONSTRAINT valid_chart_status CHECK (chart_status IN ('NOT_PREPARED','FIRST_CHART','FINAL_CHART','UNKNOWN'))
);

CREATE INDEX IF NOT EXISTS idx_chart_snapshots_lookup
  ON chart_snapshots(train_number, journey_date, boarding_station, class_code);
CREATE INDEX IF NOT EXISTS idx_chart_snapshots_expires ON chart_snapshots(expires_at);

-- ─── Coach snapshots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_snapshots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_snapshot_id UUID NOT NULL REFERENCES chart_snapshots(id) ON DELETE CASCADE,
  coach_id         VARCHAR(10) NOT NULL,
  coach_class      VARCHAR(3) NOT NULL,
  total_berths     SMALLINT,
  vacant_count     SMALLINT,
  occupied_count   SMALLINT,
  unknown_count    SMALLINT,
  data_complete    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_snapshots_chart ON coach_snapshots(chart_snapshot_id);

-- ─── Berth snapshots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS berth_snapshots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_snapshot_id UUID NOT NULL REFERENCES coach_snapshots(id) ON DELETE CASCADE,
  berth_number     SMALLINT NOT NULL,
  berth_type       VARCHAR(15) NOT NULL DEFAULT 'UNKNOWN',
  status           VARCHAR(10) NOT NULL DEFAULT 'UNKNOWN',
  vacant_from      VARCHAR(7),
  vacant_to        VARCHAR(7),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_berth_status CHECK (status IN ('VACANT','OCCUPIED','PARTIAL','UNKNOWN'))
);

CREATE INDEX IF NOT EXISTS idx_berth_snapshots_coach ON berth_snapshots(coach_snapshot_id);

-- ─── Search events (anonymous metrics only) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_number     VARCHAR(6),
  journey_date     DATE,
  class_code       VARCHAR(3),
  provider         VARCHAR(50),
  outcome          VARCHAR(20) NOT NULL,  -- 'success' | 'not_prepared' | 'provider_error' | 'not_found'
  duration_ms      INTEGER,
  error_code       VARCHAR(50),
  is_demo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup old search events (keep 30 days)
CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at);

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- Public read for trains and stations (no user accounts required)
ALTER TABLE trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE berth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

-- Service role has full access (backend uses service role key)
CREATE POLICY "service_role_all" ON trains FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON stations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON chart_snapshots FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON coach_snapshots FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON berth_snapshots FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON search_events FOR ALL TO service_role USING (true);

-- Anon users can only read (not raw payloads)
CREATE POLICY "anon_read_trains" ON trains FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_stations" ON stations FOR SELECT TO anon USING (true);
