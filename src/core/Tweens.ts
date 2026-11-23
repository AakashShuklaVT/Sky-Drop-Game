/** Maps linear progress t (0..1) to eased progress. */
export type EaseFn = (t: number) => number;

/** A few standard easing curves (see easings.net for pictures of each). */
export const Ease = {
	linear: (t: number): number => t,
	inQuad: (t: number): number => t * t,
	outQuad: (t: number): number => 1 - (1 - t) * (1 - t),
	inOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
	/** Overshoots a little, then settles: good for "pop" effects. */
	outBack: (t: number): number => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
	},
} satisfies Record<string, EaseFn>;

/** Names of T's properties whose value is a number. */
type NumericKeys<T> = { [K in keyof T]-?: T[K] extends number ? K : never }[keyof T];

/** Only the numeric properties of T, all optional, e.g. `{ x?: number; alpha?: number }` for a Container. */
export type NumericProps<T> = Partial<Pick<T, NumericKeys<T>>>;

/** Options for one tween. */
export interface TweenOptions {
	/** Seconds the tween takes. */
	duration: number;
	/** Seconds to wait before starting. */
	delay?: number;
	ease?: EaseFn;
	/** Called once, after the last value is applied. */
	onComplete?: () => void;
}

interface ActiveTween {
	target: object;
	keys: string[];
	from: number[];
	to: number[];
	duration: number;
	delay: number;
	elapsed: number;
	ease: EaseFn;
	started: boolean;
	onComplete: (() => void) | undefined;
}

/**
 * A minimal tween engine. Each scene owns one and calls `update(dt)` from its own update,
 * so when a scene is paused (or destroyed), its tweens pause (or vanish) with it.
 */
export class Tweens {
	private active: ActiveTween[] = [];

	/**
	 * Animate numeric properties of `target` to the given values.
	 * Start values are read when the tween actually starts (after `delay`).
	 */
	to<T extends object>(target: T, props: NumericProps<T>, options: TweenOptions): void {
		const keys = Object.keys(props);
		const bag = props as Record<string, number>;
		this.active.push({
			target,
			keys,
			from: [],
			to: keys.map((key) => bag[key] ?? 0),
			duration: Math.max(options.duration, 0.0001), // avoid dividing by 0
			delay: options.delay ?? 0,
			elapsed: 0,
			ease: options.ease ?? Ease.outQuad,
			started: false,
			onComplete: options.onComplete,
		});
	}

	/** Stop every tween on `target` (values stay where they are). */
	killTweensOf(target: object): void {
		this.active = this.active.filter((tween) => tween.target !== target);
	}

	/** Advance all tweens by `dt` seconds. */
	update(dt: number): void {
		// Iterate over a copy: onComplete callbacks may start new tweens.
		const running = this.active;
		this.active = [];
		const keep: ActiveTween[] = [];

		for (const tween of running) {
			// A generic object has no index signature, so we view it as a bag of numbers here.
			// NumericProps<T> above guarantees we only ever touch numeric properties.
			const bag = tween.target as Record<string, number>;

			if (tween.delay > 0) {
				tween.delay -= dt;
				keep.push(tween);
				continue;
			}
			if (!tween.started) {
				tween.started = true;
				tween.from = tween.keys.map((key) => bag[key] ?? 0);
			}

			tween.elapsed += dt;
			const t = Math.min(tween.elapsed / tween.duration, 1);
			const k = tween.ease(t);
			tween.keys.forEach((key, i) => {
				const from = tween.from[i] ?? 0;
				const to = tween.to[i] ?? 0;
				bag[key] = from + (to - from) * k;
			});

			if (t < 1) keep.push(tween);
			else tween.onComplete?.();
		}

		// Tweens created during this update (inside onComplete) were pushed to this.active.
		this.active = keep.concat(this.active);
	}

	/** Drop every tween. */
	clear(): void {
		this.active = [];
	}
}
