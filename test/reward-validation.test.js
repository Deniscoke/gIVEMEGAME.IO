/**
 * gIVEMEGAME.IO — Unit tests for reward validation gates
 * Run: node --test test/reward-validation.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
	validateDurationGate,
	validateParticipantGate,
	validateHostCooldownGate,
	HOST_COOLDOWN_MAX
} = require('../lib/reward-validation');

describe('validateDurationGate', () => {
	it('fails when session started too recently (actual < required)', () => {
		const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
		const result = validateDurationGate(oneMinuteAgo, { duration: { min: 5 } });
		assert.strictEqual(result.pass, false);
		assert.strictEqual(result.code, 'DURATION_TOO_SHORT');
		assert.ok(result.validation.duration_actual_min < 5);
		assert.strictEqual(result.validation.duration_required_min, 5);
	});

	it('passes when session ran long enough', () => {
		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
		const result = validateDurationGate(tenMinutesAgo, { duration: { min: 5 } });
		assert.strictEqual(result.pass, true);
		assert.ok(result.validation.duration_actual_min >= 5);
	});

	it('uses MIN_SESSION_DURATION_FLOOR when game has low duration.min', () => {
		const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
		const result = validateDurationGate(twoMinutesAgo, { duration: { min: 1 } });
		// Required min = max(1, 3) = 3. Actual = 2. Fail.
		assert.strictEqual(result.pass, false);
		assert.strictEqual(result.validation.duration_required_min, 3);
	});

	it('fails when started_at is null', () => {
		const result = validateDurationGate(null, { duration: { min: 5 } });
		assert.strictEqual(result.pass, false);
		assert.strictEqual(result.validation.duration_actual_min, 0);
	});
});

describe('validateParticipantGate', () => {
	it('fails when not enough paid participants', () => {
		const result = validateParticipantGate(2, { playerCount: { min: 5 } });
		assert.strictEqual(result.pass, false);
		assert.strictEqual(result.code, 'NOT_ENOUGH_PLAYERS');
		assert.strictEqual(result.validation.participants_actual, 2);
		assert.strictEqual(result.validation.participants_required, 5);
	});

	it('passes when enough participants', () => {
		const result = validateParticipantGate(6, { playerCount: { min: 5 } });
		assert.strictEqual(result.pass, true);
	});

	it('uses minimum 1 when game has no playerCount', () => {
		const result = validateParticipantGate(0, {});
		assert.strictEqual(result.pass, false);
		assert.strictEqual(result.validation.participants_required, 1);
	});
});

describe('validateHostCooldownGate', () => {
	it('fails when host completed too many sessions in last hour', () => {
		const result = validateHostCooldownGate(HOST_COOLDOWN_MAX);
		assert.strictEqual(result.pass, false);
		assert.strictEqual(result.code, 'HOST_COOLDOWN');
		assert.strictEqual(result.validation.host_sessions_last_hour, HOST_COOLDOWN_MAX);
	});

	it('fails when host completed more than max', () => {
		const result = validateHostCooldownGate(HOST_COOLDOWN_MAX + 1);
		assert.strictEqual(result.pass, false);
	});

	it('passes when under limit', () => {
		const result = validateHostCooldownGate(HOST_COOLDOWN_MAX - 1);
		assert.strictEqual(result.pass, true);
	});

	it('passes when zero', () => {
		const result = validateHostCooldownGate(0);
		assert.strictEqual(result.pass, true);
	});
});
