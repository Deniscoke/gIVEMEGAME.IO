/**
 * gIVEMEGAME.IO — Unit tests for billing helpers (Payment Link MVP)
 * Run: node --test test/billing.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { hasPaidAccess, getUserPlan } = require('../lib/billing');

describe('hasPaidAccess', () => {
	it('returns false for null/undefined', () => {
		assert.strictEqual(hasPaidAccess(null), false);
		assert.strictEqual(hasPaidAccess(undefined), false);
	});

	it('returns true when paid_access_enabled is true', () => {
		assert.strictEqual(hasPaidAccess({ paid_access_enabled: true }), true);
	});

	it('returns true when plan_code is pro_teacher_monthly', () => {
		assert.strictEqual(hasPaidAccess({ plan_code: 'pro_teacher_monthly' }), true);
	});

	it('returns false for free plan', () => {
		assert.strictEqual(hasPaidAccess({ plan_code: 'free', paid_access_enabled: false }), false);
	});
});

describe('getUserPlan', () => {
	it('returns free for null', () => {
		assert.strictEqual(getUserPlan(null), 'free');
	});

	it('returns pro_teacher_monthly when plan_code is pro', () => {
		assert.strictEqual(getUserPlan({ plan_code: 'pro_teacher_monthly' }), 'pro_teacher_monthly');
	});

	it('returns free for unknown plan_code', () => {
		assert.strictEqual(getUserPlan({ plan_code: 'other' }), 'free');
	});
});
