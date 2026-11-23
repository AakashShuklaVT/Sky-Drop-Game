import {
	AnimatedSprite,
	Assets,
	Container,
	Graphics,
	Texture,
	type Rectangle,
	type Spritesheet,
	type Ticker,
} from "pixi.js";
import { DESIGN_WIDTH } from "../core/config";
import { clamp } from "../core/math";
import { Ease, type Tweens } from "../core/Tweens";
import {
	CATCH_BOTTOM,
	CATCH_HALF_WIDTH,
	CATCH_TOP,
	PLAYER_BLINK_HZ,
	PLAYER_CHEER_FPS,
	PLAYER_CHEER_SECONDS,
	PLAYER_DEAD_SINK,
	PLAYER_DEATH_HOP,
	PLAYER_HALF_WIDTH,
	PLAYER_HURT_SECONDS,
	PLAYER_INVULNERABLE_SECONDS,
	PLAYER_SPEED,
	PLAYER_WALK_FPS,
} from "./tuning";

/**
 * What the player needs to know to move. `Input` matches this shape, and so does a
 * scripted object, which is how the menu makes her walk around on her own.
 */
export interface MoveInput {
	readonly pointerX: number | null;
	readonly axis: number;
}

/** Every pose she can be in. Exactly one at a time: that's the state machine. */
type PlayerState = "idle" | "walk" | "hurt" | "cheer" | "dead";

/** Frames + playback settings for one state. */
interface Clip {
	textures: Texture[];
	/** Frames per 1/60 s tick (AnimatedSprite's unit): fps / 60. */
	speed: number;
}

/** Look up a named animation in a loaded spritesheet, failing loudly if it's missing. */
function animation(sheet: Spritesheet, name: string): Texture[] {
	const frames = sheet.animations[name];
	if (!frames) throw new Error(`Spritesheet has no animation "${name}"`);
	return frames;
}

/**
 * The adventurer. Container holds a shadow and the animated body; the body is the only
 * thing that flips, blinks or hops, so the container's x/y always means "her feet".
 */
export class Player extends Container {
	private readonly shadow: Graphics;
	private readonly body: AnimatedSprite;
	private readonly clips: Record<PlayerState, Clip>;
	private state: PlayerState = "idle";
	private hurtTimer = 0;
	private cheerTimer = 0;
	private invulnerableTimer = 0;

	constructor() {
		super(); // must run before you use `this`: the Container part is built first

		// "player" = the spritesheet alias from the manifest. AssetPack grouped walk0..walk7
		// into an animation called "walk" because the names end in numbers.
		const sheet = Assets.get<Spritesheet>("player");
		this.clips = {
			idle: { textures: [Texture.from("idle")], speed: 0 },
			walk: { textures: animation(sheet, "walk"), speed: PLAYER_WALK_FPS / 60 },
			hurt: { textures: [Texture.from("hit")], speed: 0 },
			cheer: { textures: animation(sheet, "cheer"), speed: PLAYER_CHEER_FPS / 60 },
			dead: { textures: [Texture.from("fallDown")], speed: 0 },
		};

		this.shadow = new Graphics().ellipse(0, 0, 58, 12).fill({ color: 0x000000, alpha: 0.16 });
		this.addChild(this.shadow);

		this.body = new AnimatedSprite({
			textures: this.clips.idle.textures,
			// autoUpdate: true would tick on Ticker.shared, NOT app.ticker, so pausing the game
			// wouldn't pause her. We call body.update(ticker) ourselves from update() instead.
			autoUpdate: false,
		});
		// Anchor is measured on the texture's ORIGINAL 192×256 frame, not the trimmed one,
		// so (0.5, 1) is always the middle of her feet, whatever AssetPack trimmed away.
		this.body.anchor.set(0.5, 1);
		this.addChild(this.body);
	}

	/** True while bombs can't hurt her. */
	get isInvulnerable(): boolean {
		return this.invulnerableTimer > 0 || this.state === "dead";
	}

	/** Write her catch zone (design units) into `out`. Reuses `out` so no allocation per frame. */
	getCatchBox(out: Rectangle): Rectangle {
		out.x = this.x - CATCH_HALF_WIDTH;
		out.y = this.y - CATCH_TOP;
		out.width = CATCH_HALF_WIDTH * 2;
		out.height = CATCH_TOP - CATCH_BOTTOM;
		return out;
	}

	/** Bomb hit: hurt face + a short invulnerability window. */
	hurt(): void {
		this.hurtTimer = PLAYER_HURT_SECONDS;
		this.invulnerableTimer = PLAYER_INVULNERABLE_SECONDS;
	}

	/** Celebrate for `seconds` (Infinity = until something else happens). */
	cheer(seconds = PLAYER_CHEER_SECONDS): void {
		this.cheerTimer = seconds;
	}

	/** Out of lives: hop up and land upside down. */
	die(tweens: Tweens): void {
		this.setState("dead");
		this.body.alpha = 1;
		tweens.to(this.body, { y: -PLAYER_DEATH_HOP }, {
			duration: 0.28,
			ease: Ease.outQuad,
			onComplete: () => {
				tweens.to(this.body, { y: PLAYER_DEAD_SINK }, { duration: 0.32, ease: Ease.inQuad });
			},
		});
	}

	/** Show a pose without any movement (menu / game-over screens). */
	pose(state: "idle" | "cheer" | "dead"): void {
		this.setState(state);
		if (state === "dead") this.body.y = PLAYER_DEAD_SINK;
	}

	/**
	 * Advance one frame: move from `input` (null = stand still), pick the pose, animate.
	 * Takes the Ticker (not just dt) because AnimatedSprite.update needs it.
	 */
	update(ticker: Ticker, input: MoveInput | null): void {
		const dt = ticker.deltaMS / 1000;
		this.hurtTimer = Math.max(0, this.hurtTimer - dt);
		this.cheerTimer = Math.max(0, this.cheerTimer - dt);
		this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);

		if (this.state !== "dead") {
			const dx = input ? this.move(dt, input) : 0;
			this.setState(this.pickState(dx));

			// Blink while invulnerable: visible for half of each blink period.
			this.body.alpha =
				this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * PLAYER_BLINK_HZ * 2) % 2 === 0 ? 0.35 : 1;
		}

		this.body.update(ticker);
	}

	/** Move toward the pointer / along the keyboard axis. Returns how far she moved. */
	private move(dt: number, input: MoveInput): number {
		// The furthest she may move this frame (same top speed for touch and keyboard).
		const maxStep = PLAYER_SPEED * dt;
		let dx: number;

		if (input.pointerX !== null) {
			// Run toward the finger, but never faster than maxStep → no teleporting.
			const diff = input.pointerX - this.x;
			dx = Math.abs(diff) <= maxStep ? diff : Math.sign(diff) * maxStep;
		} else {
			// Keyboard: axis is -1, 0 or 1.
			dx = input.axis * maxStep;
		}

		// Keep her whole body inside the design area.
		const before = this.x;
		this.x = clamp(this.x + dx, PLAYER_HALF_WIDTH, DESIGN_WIDTH - PLAYER_HALF_WIDTH);
		const moved = this.x - before; // 0 when pushing against a wall → idle, not moonwalking

		// Face the way she's moving. Flip only the body, not the Player container.
		if (moved !== 0) this.body.scale.x = Math.sign(moved);
		return moved;
	}

	/** Priority order: hurt beats walking, walking beats cheering, cheering beats idle. */
	private pickState(dx: number): PlayerState {
		if (this.hurtTimer > 0) return "hurt";
		if (dx !== 0) return "walk";
		if (this.cheerTimer > 0) return "cheer";
		return "idle";
	}

	/**
	 * Switch pose. Only on an actual CHANGE: setting `textures` calls gotoAndStop(0),
	 * so doing it every frame would freeze the walk on frame 0.
	 */
	private setState(next: PlayerState): void {
		if (next === this.state) return;
		this.state = next;
		const clip = this.clips[next];
		this.body.textures = clip.textures; // → gotoAndStop(0)
		this.body.animationSpeed = clip.speed;
		this.body.play(); // so restart it
	}
}
