/**
 * Safe wrappers around localStorage.
 *
 * localStorage can throw (Safari private mode, storage disabled, quota full) or be wiped at any time,
 * so every read has a fallback and every write is allowed to fail silently.
 */

/** Read a number, or `fallback` if it is missing, unreadable or not a number. */
export function loadNumber(key: string, fallback: number): number {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const value = Number(raw);
		return Number.isFinite(value) ? value : fallback;
	} catch {
		return fallback;
	}
}

/** Read a boolean saved by `saveBool`. */
export function loadBool(key: string, fallback: boolean): boolean {
	try {
		const raw = localStorage.getItem(key);
		return raw === null ? fallback : raw === "1";
	} catch {
		return fallback;
	}
}

/** Write a number. Failure is ignored: losing a saved value must never crash the game. */
export function saveNumber(key: string, value: number): void {
	try {
		localStorage.setItem(key, String(value));
	} catch {
		// storage unavailable: nothing we can do
	}
}

/** Write a boolean as "1" / "0". */
export function saveBool(key: string, value: boolean): void {
	try {
		localStorage.setItem(key, value ? "1" : "0");
	} catch {
		// storage unavailable: nothing we can do
	}
}
