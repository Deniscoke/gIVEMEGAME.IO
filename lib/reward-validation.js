/**
 * gIVEMEGAME.IO — Reward validation logic (extracted for testing)
 * Pure functions — no DB, no side effects.
 */

const MIN_SESSION_DURATION_FLOOR = 3;
const MIN_SESSION_DURATION_FALLBACK = 5;
const HOST_COOLDOWN_MAX = 5;

/**
 * Validates duration gate.
 * @param {Date|string|null} startedAt - When session started
 * @param {object} gameJson - Game object with duration.min
 * @returns {{ pass: boolean, code?: string, validation: object }}
 */
function validateDurationGate(startedAt, gameJson) {
	const gameDurMin = gameJson?.duration?.min;
	const requiredMin = Math.max(
		gameDurMin != null ? gameDurMin : MIN_SESSION_DURATION_FALLBACK,
		MIN_SESSION_DURATION_FLOOR
	);
	const started = startedAt ? new Date(startedAt) : null;
	const actualMin = started ? (Date.now() - started.getTime()) / 60000 : 0;

	if (actualMin < requiredMin) {
		return {
			pass: false,
			code: 'DURATION_TOO_SHORT',
			validation: {
				duration_actual_min: Math.round(actualMin * 10) / 10,
				duration_required_min: requiredMin,
				passed: false,
				failed_gate: 'DURATION_TOO_SHORT',
				validated_at: new Date().toISOString()
			}
		};
	}
	return { pass: true, validation: { duration_actual_min: actualMin, duration_required_min: requiredMin } };
}

/**
 * Validates participant count gate.
 * @param {number} actualPlayers - Count of participants with coins_paid > 0
 * @param {object} gameJson - Game object with playerCount.min
 * @returns {{ pass: boolean, code?: string, validation: object }}
 */
function validateParticipantGate(actualPlayers, gameJson) {
	const gamePlayerMin = gameJson?.playerCount?.min || 1;
	const requiredPlayers = Math.max(gamePlayerMin, 1);

	if (actualPlayers < requiredPlayers) {
		return {
			pass: false,
			code: 'NOT_ENOUGH_PLAYERS',
			validation: {
				participants_actual: actualPlayers,
				participants_required: requiredPlayers,
				passed: false,
				failed_gate: 'NOT_ENOUGH_PLAYERS',
				validated_at: new Date().toISOString()
			}
		};
	}
	return { pass: true, validation: { participants_actual: actualPlayers, participants_required: requiredPlayers } };
}

/**
 * Validates host cooldown gate.
 * @param {number} hostSessionsLastHour - Completed sessions by host in last hour
 * @returns {{ pass: boolean, code?: string, validation: object }}
 */
function validateHostCooldownGate(hostSessionsLastHour) {
	if (hostSessionsLastHour >= HOST_COOLDOWN_MAX) {
		return {
			pass: false,
			code: 'HOST_COOLDOWN',
			validation: {
				host_sessions_last_hour: hostSessionsLastHour,
				host_cooldown_max: HOST_COOLDOWN_MAX,
				passed: false,
				failed_gate: 'HOST_COOLDOWN',
				validated_at: new Date().toISOString()
			}
		};
	}
	return { pass: true, validation: { host_sessions_last_hour: hostSessionsLastHour, host_cooldown_max: HOST_COOLDOWN_MAX } };
}

module.exports = {
	validateDurationGate,
	validateParticipantGate,
	validateHostCooldownGate,
	MIN_SESSION_DURATION_FLOOR,
	MIN_SESSION_DURATION_FALLBACK,
	HOST_COOLDOWN_MAX
};
