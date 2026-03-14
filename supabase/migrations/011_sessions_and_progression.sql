-- ═══════════════════════════════════════════════════════════════════
-- gIVEMEGAME.IO — Sessions + Competency Progression
-- Migration 011
-- ═══════════════════════════════════════════════════════════════════

-- 1. Competency points on profiles (JSONB — keys match rvp.json kompetence keys)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS competency_points JSONB NOT NULL DEFAULT '{}';

-- 2. Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_json     JSONB NOT NULL,
  join_code     TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','active','reflection','completed')),
  timer_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_host   ON public.sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code   ON public.sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);

-- 3. Session participants
CREATE TABLE IF NOT EXISTS public.session_participants (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_paid           INTEGER NOT NULL DEFAULT 0,
  reflection_data      JSONB,
  reflection_done      BOOLEAN NOT NULL DEFAULT false,
  awarded_competencies JSONB,
  joined_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sp_session ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_sp_user    ON public.session_participants(user_id);

-- 4. RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Sessions: authenticated users can read (needed for join by code); only host modifies
CREATE POLICY "Sessions readable by authenticated"
  ON public.sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Host can insert session"
  ON public.sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update session"
  ON public.sessions FOR UPDATE USING (auth.uid() = host_id);

-- Participants: own rows only
CREATE POLICY "Participants view own rows"
  ON public.session_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Participants insert own row"
  ON public.session_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants update own row"
  ON public.session_participants FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.session_participants TO authenticated;
