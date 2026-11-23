import type { Rectangle } from "pixi.js";

/** Limit `value` to the range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/** Blend from `a` (t = 0) to `b` (t = 1). */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Random float in [min, max). */
export function randomRange(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

/** Something that can be picked by `pickWeighted`. */
export interface Weighted {
	readonly weight: number;
}

/**
 * Pick one entry at random; an entry with weight 20 is twice as likely as one with weight 10.
 * Throws on an empty list so a config mistake fails loudly instead of returning `undefined`.
 */
export function pickWeighted<T extends Weighted>(entries: readonly T[]): T {
	const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
	let roll = Math.random() * total;
	for (const entry of entries) {
		roll -= entry.weight;
		if (roll < 0) return entry;
	}
	const last = entries[entries.length - 1];
	if (!last) throw new Error("pickWeighted: empty list");
	return last; // only reached through float rounding
}

/** True if the circle (cx, cy, r) touches the rectangle. */
export function circleIntersectsRect(cx: number, cy: number, r: number, rect: Rectangle): boolean {
	// Closest point of the rectangle to the circle's centre...
	const nearestX = clamp(cx, rect.x, rect.x + rect.width);
	const nearestY = clamp(cy, rect.y, rect.y + rect.height);
	// ...is it within r of the centre? (compare squared lengths: no Math.sqrt needed)
	const dx = cx - nearestX;
	const dy = cy - nearestY;
	return dx * dx + dy * dy <= r * r;
}
