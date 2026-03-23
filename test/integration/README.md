# Integration Tests

## Rate Limit (`rate-limit.test.js`)

Tests that `/api/generate-game` returns 429 `RATE_LIMIT_EXCEEDED` after 10 requests per minute per IP.

**Run:** `npm run test:integration` or `node --test test/integration/rate-limit.test.js`

**Note:** With `OPENAI_API_KEY` set, requests hit OpenAI and the test may take 30–60s. Without the key, the handler returns 400 quickly and the test finishes in seconds.

---

## Reward Gates (Manual)

These require a real Supabase DB and valid JWTs:

| Test | Manual Steps |
|------|--------------|
| **Duplicate /complete** | Create session, start, wait 3+ min, have 2 tabs/browsers call `POST /complete` nearly simultaneously → one succeeds, one gets 409 ALREADY_COMPLETED |
| **SOLO_DAILY_LIMIT** | Complete 10 solo games in 24h → 11th returns 429 SOLO_DAILY_LIMIT |

See `docs/SMOKE_TEST_PLAN.md` for full manual verification flow.
