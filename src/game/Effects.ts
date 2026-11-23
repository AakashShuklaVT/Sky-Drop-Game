import { BitmapText, Container, Particle, ParticleContainer, Texture } from "pixi.js";
import { Pool } from "../core/Pool";
import { randomRange } from "../core/math";
import { FONT_POPUP } from "./theme";
import { PARTICLE_GRAVITY, PARTICLE_LIFE, POPUP_RISE, POPUP_SECONDS } from "./tuning";

/** One particle plus the physics data Pixi's lightweight Particle doesn't store. */
interface Spark {
	particle: Particle;
	vx: number;
	vy: number;
	spin: number;
	life: number;
	maxLife: number;
	size: number;
	gravity: number;
}

/** A floating "+5". */
interface Popup {
	text: BitmapText;
	startY: number;
	life: number;
}

/** Options for one burst of particles. */
export interface BurstOptions {
	count: number;
	speed: number;
	color: number;
	/** Particle scale (the star frame is 128 px). */
	size?: number;
	/** Set false for smoke-like puffs that float instead of fall. */
	gravity?: boolean;
}

/**
 * All short-lived eye candy: particle bursts and score popups. Both are pooled.
 *
 * Particles use a ParticleContainer: it skips most of what a normal Container does (no children,
 * no events, no filters) and uploads every particle in one buffer, so hundreds cost almost nothing.
 * The catch: every particle must use the SAME texture source, here the items spritesheet.
 */
export class Effects extends Container {
	private readonly particles: ParticleContainer;
	private readonly sparks: Spark[] = []; // same order as particles.particleChildren
	private readonly sparkPool: Pool<Spark>;
	private readonly popupLayer = new Container();
	private readonly popups: Popup[] = [];
	private readonly popupPool: Pool<BitmapText>;

	constructor() {
		super();
		const texture = Texture.from("star");

		this.particles = new ParticleContainer({
			texture,
			// Only these properties are re-uploaded to the GPU every frame. Anything left false
			// is uploaded once, so changing it later would silently do nothing.
			dynamicProperties: { position: true, rotation: true, color: true, vertex: true },
		});
		this.addChild(this.particles, this.popupLayer);

		this.sparkPool = new Pool(() => ({
			particle: new Particle({ texture, anchorX: 0.5, anchorY: 0.5 }),
			vx: 0, vy: 0, spin: 0, life: 0, maxLife: 1, size: 1, gravity: 0,
		}));
		this.sparkPool.prewarm(80);

		this.popupPool = new Pool(() => {
			const text = new BitmapText({ text: "", style: { fontFamily: FONT_POPUP, fontSize: 52 } });
			text.anchor.set(0.5);
			return text;
		});
	}

	/** Throw `count` particles out from (x, y). */
	burst(x: number, y: number, options: BurstOptions): void {
		const size = options.size ?? 0.3;
		for (let i = 0; i < options.count; i++) {
			const spark = this.sparkPool.get();
			const angle = randomRange(0, Math.PI * 2);
			const speed = randomRange(0.4, 1) * options.speed;
			spark.vx = Math.cos(angle) * speed;
			spark.vy = Math.sin(angle) * speed - (options.gravity === false ? 0 : speed * 0.4); // bias upward
			spark.spin = randomRange(-8, 8);
			spark.maxLife = spark.life = randomRange(0.6, 1) * PARTICLE_LIFE;
			spark.size = randomRange(0.6, 1) * size;
			spark.gravity = options.gravity === false ? -60 : PARTICLE_GRAVITY;

			const p = spark.particle;
			p.x = x;
			p.y = y;
			p.rotation = 0;
			p.tint = options.color;
			p.alpha = 1;
			p.scaleX = p.scaleY = spark.size;

			this.sparks.push(spark);
			this.particles.particleChildren.push(p);
		}
		this.particles.update(); // required after editing particleChildren directly
	}

	/** Show floating text (only characters installed in the popup font: digits, "+", "x", "!"). */
	popup(x: number, y: number, label: string, color: number): void {
		const text = this.popupPool.get();
		text.text = label;
		text.tint = color;
		text.position.set(x, y);
		text.alpha = 1;
		text.scale.set(0.6);
		this.popupLayer.addChild(text);
		this.popups.push({ text, startY: y, life: POPUP_SECONDS });
	}

	/** Advance all effects by `dt` seconds. */
	update(dt: number): void {
		this.updateSparks(dt);
		this.updatePopups(dt);
	}

	private updateSparks(dt: number): void {
		const children = this.particles.particleChildren;
		let removed = false;

		// Walk backwards so swap-removing doesn't skip anything.
		for (let i = this.sparks.length - 1; i >= 0; i--) {
			const spark = this.sparks[i];
			if (!spark) continue;
			spark.life -= dt;

			if (spark.life <= 0) {
				// Swap-remove: move the last entry into this slot. O(1), unlike splice.
				// Both arrays get the same treatment so they stay in the same order.
				const lastSpark = this.sparks.pop();
				const lastParticle = children.pop();
				if (i < this.sparks.length && lastSpark && lastParticle) {
					this.sparks[i] = lastSpark;
					children[i] = lastParticle;
				}
				this.sparkPool.release(spark);
				removed = true;
				continue;
			}

			spark.vy += spark.gravity * dt;
			const p = spark.particle;
			p.x += spark.vx * dt;
			p.y += spark.vy * dt;
			p.rotation += spark.spin * dt;
			const t = spark.life / spark.maxLife; // 1 → 0
			p.alpha = t;
			p.scaleX = p.scaleY = spark.size * (0.4 + 0.6 * t);
		}

		if (removed) this.particles.update();
	}

	private updatePopups(dt: number): void {
		for (let i = this.popups.length - 1; i >= 0; i--) {
			const popup = this.popups[i];
			if (!popup) continue;
			popup.life -= dt;
			const t = 1 - popup.life / POPUP_SECONDS; // 0 → 1
			popup.text.y = popup.startY - POPUP_RISE * t;
			popup.text.scale.set(t < 0.15 ? 0.6 + (t / 0.15) * 0.5 : 1.1 - 0.1 * t); // quick pop, then settle
			popup.text.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;

			if (popup.life <= 0) {
				this.popupLayer.removeChild(popup.text);
				this.popupPool.release(popup.text);
				const last = this.popups.pop();
				if (last && i < this.popups.length) this.popups[i] = last;
			}
		}
	}
}
