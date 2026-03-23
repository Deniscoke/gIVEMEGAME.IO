# Smoke Test Plan — gIVEMEGAME.IO

**Purpose:** Manual verification flow for MVP release. Run through this checklist before deployment or after major changes.

**Prerequisites:** `npm start` running, valid `.env` (OPENAI_API_KEY, SUPABASE_*), Google OAuth configured.

---

## 1. Login

1. Open `http://localhost:3000` (or deployed URL)
2. Click **Sign in with Google**
3. Complete OAuth flow
4. **Verify:** Redirected to app, profile icon visible, coin balance shown

---

## 2. Generate Game (AI)

1. Select a mode (e.g. **Party**)
2. Set filters: age, players, duration
3. Click **SPAWNUJ HRU**
4. **Verify:** Loading animation, then game card appears with title, instructions, materials
5. **Verify:** Coins decreased by 125

---

## 3. Generate Game (Fallback)

1. Stop server or set `OPENAI_API_KEY` to invalid/empty
2. Restart, click **SPAWNUJ HRU**
3. **Verify:** Game card appears from local `games.json` (fallback)
4. **Verify:** No OpenAI error shown to user

---

## 4. Create Session

1. Generate a game (or use existing from history)
2. Click **Vytvor session** / **Create session** (multiplayer flow)
3. **Verify:** Join code displayed (e.g. TIGER42)
4. **Verify:** Lobby shows host, participants list

---

## 5. Join Session (second user)

1. In incognito or another browser: log in as different user
2. Enter join code from step 4
3. Click **Join**
4. **Verify:** 100 coins deducted, user appears in participants list
5. **Verify:** Host sees new participant

---

## 6. Start Session

1. As host, click **Start** / **Štart**
2. **Verify:** Session status → `active`
3. **Verify:** Timer starts counting down
4. **Verify:** All participants charged 100 coins (if not already)

---

## 7. Complete Session

1. Wait at least 3 minutes (duration gate) — or temporarily lower `MIN_SESSION_DURATION_FLOOR` for quick test
2. Each participant: submit reflection form (all 7 competency questions + open)
3. Host clicks **Complete** / **Dokončiť**
4. **Verify:** Session status → `completed`
5. **Verify:** Each participant gets +100 coins, competency points updated
6. **Verify:** Competency panel shows flash animation + updated bars

---

## 8. Verify Coin Flow

| Action        | Expected Δ |
|---------------|------------|
| New user      | +150       |
| Generate game | -125       |
| Surprise      | -50        |
| Join session  | -100       |
| Complete (player) | +100  |
| Solo complete | +100       |
| Robot Challenge | +250     |
| SMARTA fact   | +50        |

Check `GET /api/coins/history` or coin menu in UI.

---

## 9. Verify Competency Awards

1. After session/solo complete: `GET /api/profile/competencies`
2. **Verify:** `competency_points` increased for game's `rvp.kompetence` keys
3. **Verify:** +50 per competency listed in game

---

## 10. Reward Validation Gates (optional deep test)

- **DURATION_TOO_SHORT:** Start session, complete immediately (< 3 min) → expect 422, code `DURATION_TOO_SHORT`
- **NOT_ENOUGH_PLAYERS:** Create session with game requiring 5 players, complete with only 1 → expect 422, `NOT_ENOUGH_PLAYERS`
- **HOST_COOLDOWN:** Complete 5+ sessions as same host within 1 hour → 6th should return 429, `HOST_COOLDOWN`
- **SOLO_DAILY_LIMIT:** Complete 10 solo games in 24h → 11th should return 429, `SOLO_DAILY_LIMIT`
- **Duplicate complete:** Call `POST /api/sessions/:code/complete` twice quickly → first succeeds, second returns 409 `ALREADY_COMPLETED`

---

## Quick Checklist

- [ ] Login
- [ ] Generate game (AI)
- [ ] Generate game (fallback)
- [ ] Create session
- [ ] Join session
- [ ] Start session
- [ ] Complete session
- [ ] Coin flow correct
- [ ] Competency awards correct

---

*Run after deployment to Vercel: replace localhost with production URL.*
