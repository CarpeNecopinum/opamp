const KEY_PREFIX = 'opamp-submitted-';

/**
 * SHA-256 of the survey token, so the raw token is never stored in
 * localStorage. Returns `null` when Web Crypto is unavailable.
 */
async function tokenHash(token: string): Promise<string | null> {
	if (typeof crypto === 'undefined' || !crypto.subtle) return null;

	const bytes = new TextEncoder().encode(token);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Marks the survey behind `token` as submitted in this browser. Best-effort:
 * no-ops when localStorage or Web Crypto is unavailable.
 */
export async function markSubmitted(token: string): Promise<void> {
	try {
		const hash = await tokenHash(token);
		if (!hash || typeof localStorage === 'undefined') return;
		localStorage.setItem(KEY_PREFIX + hash, String(Date.now()));
	} catch {
		// Storage may be unavailable (private mode, quota) — the guard is
		// only a soft hint, so ignore failures.
	}
}

/** Whether this browser has already submitted the survey behind `token`. */
export async function hasSubmitted(token: string): Promise<boolean> {
	try {
		const hash = await tokenHash(token);
		if (!hash || typeof localStorage === 'undefined') return false;
		return localStorage.getItem(KEY_PREFIX + hash) !== null;
	} catch {
		return false;
	}
}
