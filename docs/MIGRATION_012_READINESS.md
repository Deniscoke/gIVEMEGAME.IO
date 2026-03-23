# Migration 012 — Reward Validation — Readiness Audit

**Migration file:** `supabase/migrations/012_reward_validation.sql`  
**Status:** Must be run **manually** in Supabase Dashboard SQL Editor.  
**DO NOT** auto-run migrations in production without explicit approval.

---

## What Migration 012 Adds

| Change | Purpose |
|--------|---------|
| `sessions.started_at` (TIMESTAMPTZ) | Set when host clicks Start; used for duration gate |
| `sessions.reward_validation` (JSONB) | Audit trail of validation result (pass/fail, gates) |
| Status `'completing'` in CHECK constraint | Atomic lock for `/complete` — prevents concurrent double-award |
| `idx_sessions_host_completed` | Index for host cooldown query |
| `idx_coin_tx_solo_cooldown` | Index for solo daily limit query |

---

## Code Dependencies (server.js)

### 1. `started_at`

| Location | Usage |
|----------|-------|
| `POST /api/sessions/:code/start` (line ~1393) | `UPDATE ... SET started_at = NOW()` |
| `POST /api/sessions/:code/complete` (line ~1455) | `SELECT ... started_at` |
| Duration gate (line ~1476) | `sess.started_at` → `actualMin` |

**If column missing:**
- `UPDATE ... started_at = NOW()` → **PostgreSQL error: column "started_at" does not exist**
- `/start` fails with 500
- Sessions cannot transition to `active` with a timestamp

### 2. `reward_validation`

| Location | Usage |
|----------|-------|
| `/complete` on validation failure (DURATION, NOT_ENOUGH_PLAYERS, HOST_COOLDOWN) | `UPDATE ... reward_validation = $1` |
| `/complete` on success | `UPDATE ... reward_validation = $1` (audit) |

**If column missing:**
- `UPDATE ... reward_validation = ...` → **PostgreSQL error: column "reward_validation" does not exist**
- `/complete` fails with 500 on any validation path (pass or fail)

### 3. Status `'completing'`

| Location | Usage |
|----------|-------|
| Atomic CAS lock (line ~1557) | `UPDATE ... SET status = 'completing' WHERE status IN ('active','reflection')` |
| Rollback on tx error (line ~1661) | `UPDATE ... SET status = 'active' WHERE status = 'completing'` |
| Final transition (line ~1650) | `UPDATE ... SET status = 'completed'` |

**If `'completing'` not in CHECK:**
- `UPDATE ... status = 'completing'` → **PostgreSQL constraint violation**
- `/complete` fails with 500
- **Race condition:** Two concurrent `/complete` requests could both award — atomic CAS prevents this

---

## What Breaks If Migration 012 Is NOT Run

1. **`POST /api/sessions/:code/start`** — 500 (column started_at missing)
2. **`POST /api/sessions/:code/complete`** — 500 (column reward_validation missing, or constraint rejects 'completing')
3. **Session multiplayer flow is fully broken** until migration is applied

---

## Exact SQL to Run (Manual)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **SQL Editor** → **New query**
3. Paste the entire content of `supabase/migrations/012_reward_validation.sql`
4. Click **Run**
5. Expected: "Success. No rows returned"
6. Verify: Table Editor → `sessions` → columns `started_at`, `reward_validation` exist; constraint allows `completing`

---

## Pre-012 State (Migration 011)

Migration 011 defines:
- `status CHECK (status IN ('waiting','active','reflection','completed'))` — no `completing`
- No `started_at`, no `reward_validation`

---

## Recommendation

**Run Migration 012 before deploying** session/reward features. The app will not function correctly for multiplayer sessions without it.
