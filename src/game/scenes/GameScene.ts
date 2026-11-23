import { Container, Rectangle, type DestroyOptions, type Ticker } from "pixi.js";
import { DESIGN_WIDTH } from "../../core/config";
import { circleIntersectsRect } from "../../core/math";
import { Pool } from "../../core/Pool";
import { Scene } from "../../core/Scene";
import { playSfx } from "../../core/Sfx";
import { Shake } from "../../core/Shake";
import { Tweens } from "../../core/Tweens";
import type { GameContext } from "../context";
import { Effects } from "../Effects";
import { Hud } from "../Hud";
import { Item } from "../Item";
import type { ItemType } from "../items";
import { Player } from "../Player";
import { ScoreKeeper, type GameResult } from "../ScoreKeeper";
import { Spawner } from "../Spawner";
import { COLORS } from "../theme";
import {
	DEATH_DELAY_SECONDS,
	EXPLOSION_COUNT,
	EXPLOSION_SPEED,
	GROUND_Y,
	MISS_Y,
	PUFF_COUNT,
	PUFF_SPEED,
	SHAKE_BOMB_HIT,
	SHAKE_DEATH,
	SHAKE_DECAY_PER_SECOND,
	SHAKE_MAX_OFFSET,
	SPARKLE_COUNT,
	SPARKLE_SPEED,
	SPAWN_ABOVE,
} from "../tuning";
import { PauseMenu } from "../ui/PauseMenu";

/** playing → (paused ↔ playing) → dying → game over scene. */
type Phase = "playing" | "paused" | "dying";

/** Items made before play starts, so the first seconds never allocate. */
const ITEM_PREWARM = 24;

/**
 * The actual game.
 *
 *   GameScene
 *    ├─ world        ← shaken by Shake (HUD is not, so it stays readable)
 *    │   ├─ itemLayer   pooled Items
 *    │   ├─ player
 *    │   └─ effects     particles + popups
 *    ├─ hud
 *    └─ pauseMenu    (hidden unless paused)
 *
 * Systems: Spawner decides what falls, ScoreKeeper owns the rules/numbers,
 * this class wires them together and turns events into visuals and sounds.
 */
export class GameScene extends Scene {
	private readonly ctx: GameContext;
	private readonly world = new Container();
	private readonly itemLayer = new Container();
	private readonly player = new Player();
	private readonly fx = new Effects();
	private readonly tweens = new Tweens();
	private readonly hud: Hud;
	private readonly pauseMenu: PauseMenu;
	private readonly shake: Shake;
	private readonly spawner: Spawner;
	private readonly score = new ScoreKeeper();
	private readonly itemPool: Pool<Item>;
	private readonly items: Item[] = []; // the ones currently falling
	private readonly catchBox = new Rectangle();

	private phase: Phase = "playing";
	private deathTimer = 0;
	private result: GameResult | null = null;
	private spawnY = 0;

	constructor(ctx: GameContext) {
		super();
		this.ctx = ctx;

		this.itemPool = new Pool(() => {
			const item = new Item();
			this.itemLayer.addChild(item); // stays a child forever; hidden while in the pool
			return item;
		});
		this.itemPool.prewarm(ITEM_PREWARM);

		this.player.position.set(DESIGN_WIDTH / 2, GROUND_Y);
		this.world.addChild(this.itemLayer, this.player, this.fx);

		this.hud = new Hud(this.tweens, this.pause);
		this.pauseMenu = new PauseMenu(ctx.settings, { onResume: this.resume, onQuit: ctx.router.toMenu });

		this.shake = new Shake(this.world, SHAKE_MAX_OFFSET, SHAKE_DECAY_PER_SECOND);
		this.spawner = new Spawner(this.spawn);

		this.addChild(this.world, this.hud, this.pauseMenu);

		// Production must-have: auto-pause when the tab/app goes to the background.
		document.addEventListener("visibilitychange", this.onVisibilityChange);
	}

	override resize(visible: Rectangle, safe: Rectangle): void {
		this.spawnY = visible.top - SPAWN_ABOVE; // just above what the player can see
		this.hud.layout(safe);
		this.pauseMenu.layout(visible);
	}

	override update(ticker: Ticker): void {
		const input = this.ctx.input;

		if (this.phase === "paused") {
			if (input.consumePress("Escape", "KeyP")) this.resume();
			return; // nothing below runs: world, tweens, animations all freeze
		}
		if (this.phase === "playing" && input.consumePress("Escape", "KeyP")) {
			this.pause();
			return;
		}

		const dt = ticker.deltaMS / 1000;

		this.player.update(ticker, this.phase === "playing" ? input : null);
		if (this.phase === "playing") this.spawner.update(dt);
		this.updateItems(dt);
		this.fx.update(dt);
		this.tweens.update(dt);
		this.shake.update(dt);

		if (this.phase === "dying") {
			this.deathTimer -= dt;
			if (this.deathTimer <= 0 && this.result) this.ctx.router.toGameOver(this.result);
		}
	}

	override destroy(options?: DestroyOptions): void {
		document.removeEventListener("visibilitychange", this.onVisibilityChange);
		super.destroy(options);
	}

	// ---------- items ----------

	/** Spawner callback: take an item from the pool and drop it. */
	private spawn = (type: ItemType, x: number, speed: number): void => {
		const item = this.itemPool.get();
		item.reset(type, x, this.spawnY, speed);
		this.items.push(item);
	};

	private updateItems(dt: number): void {
		const box = this.player.getCatchBox(this.catchBox);
		const canCatch = this.phase === "playing";

		// Backwards, so removing item i doesn't skip the next one.
		for (let i = this.items.length - 1; i >= 0; i--) {
			const item = this.items[i];
			if (!item) continue;
			item.update(dt);

			const isBomb = item.type.kind === "bomb";
			const touching = canCatch && circleIntersectsRect(item.x, item.y, item.type.radius, box);

			if (touching && (!isBomb || !this.player.isInvulnerable)) {
				if (isBomb) this.onBombHit(item);
				else this.onCatch(item);
				this.removeItem(i);
			} else if (item.y > MISS_Y) {
				this.onGround(item);
				this.removeItem(i);
			}
		}
	}

	/** Swap-remove from the active list and return to the pool. */
	private removeItem(index: number): void {
		const item = this.items[index];
		const last = this.items.pop();
		if (last && last !== item) this.items[index] = last;
		if (item) {
			item.visible = false;
			this.itemPool.release(item);
		}
	}

	// ---------- events → feedback ----------

	private onCatch(item: Item): void {
		const type = item.type;
		const gained = this.score.collect(type);

		this.hud.setScore(this.score.score);
		this.hud.setCombo(this.score.multiplier);
		this.fx.burst(item.x, item.y, { count: SPARKLE_COUNT, speed: SPARKLE_SPEED, color: type.color });
		this.fx.popup(item.x, item.y - 40, `+${gained}`, type.color);
		playSfx(type.sound, 0.7);

		if (type.kind === "star") this.player.cheer();
	}

	private onBombHit(item: Item): void {
		const lives = this.score.hitBomb();

		this.hud.setLives(lives);
		this.hud.setCombo(this.score.multiplier);
		this.fx.burst(item.x, item.y, { count: EXPLOSION_COUNT, speed: EXPLOSION_SPEED, color: COLORS.orange, size: 0.4 });
		this.fx.burst(item.x, item.y, { count: EXPLOSION_COUNT / 2, speed: EXPLOSION_SPEED / 2, color: COLORS.dim, size: 0.35 });
		this.shake.add(SHAKE_BOMB_HIT);
		playSfx("hurt");

		if (lives <= 0) this.die();
		else this.player.hurt();
	}

	/** Something reached the ground without being caught. */
	private onGround(item: Item): void {
		this.fx.burst(item.x, GROUND_Y - 10, { count: PUFF_COUNT, speed: PUFF_SPEED, color: COLORS.white, size: 0.25, gravity: false });
		if (item.type.kind === "bomb" || this.phase !== "playing") return; // dodged bombs cost nothing

		this.score.miss();
		this.hud.setCombo(this.score.multiplier);
		playSfx("disappear", 0.4);
	}

	// ---------- phases ----------

	private die(): void {
		this.phase = "dying";
		this.deathTimer = DEATH_DELAY_SECONDS;
		this.result = this.score.finish(); // saves the best score right now, not on the next screen
		this.player.die(this.tweens);
		this.shake.add(SHAKE_DEATH);
		this.hud.visible = false;
	}

	private pause = (): void => {
		if (this.phase !== "playing") return;
		this.phase = "paused";
		this.pauseMenu.visible = true;
	};

	private resume = (): void => {
		if (this.phase !== "paused") return;
		this.phase = "playing";
		this.pauseMenu.visible = false;
	};

	private onVisibilityChange = (): void => {
		if (document.hidden) this.pause();
	};
}
