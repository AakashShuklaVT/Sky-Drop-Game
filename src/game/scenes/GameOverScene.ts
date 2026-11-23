import { Text, type Ticker } from "pixi.js";
import { DESIGN_WIDTH } from "../../core/config";
import { Scene } from "../../core/Scene";
import { SpriteNumber } from "../../core/SpriteNumber";
import { Ease, Tweens } from "../../core/Tweens";
import type { GameContext } from "../context";
import { Player } from "../Player";
import type { GameResult } from "../ScoreKeeper";
import { COLORS, FONT_UI } from "../theme";
import { GROUND_Y, HUD_DIGIT_ADVANCE } from "../tuning";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";

const PANEL_WIDTH = 560;
const PANEL_HEIGHT = 640;
const PANEL_Y = 560;

/** Final score, best score, and the way back in. */
export class GameOverScene extends Scene {
	private readonly ctx: GameContext;
	private readonly tweens = new Tweens();
	private readonly player: Player;
	private readonly badge: Text | null = null;
	private time = 0;

	constructor(ctx: GameContext, result: GameResult) {
		super();
		this.ctx = ctx;

		const panel = new Panel(PANEL_WIDTH, PANEL_HEIGHT, "Game Over");
		panel.position.set(DESIGN_WIDTH / 2, PANEL_Y);

		const scoreLabel = new Text({ text: "SCORE", style: { fontFamily: FONT_UI, fontSize: 30, fill: COLORS.inkSoft } });
		scoreLabel.anchor.set(0.5);
		scoreLabel.y = -150;

		const score = new SpriteNumber({ frameFor: (c) => `digit_${c}`, advance: HUD_DIGIT_ADVANCE, align: "center" });
		score.text = String(result.score);
		score.y = -75;

		const best = new Text({ text: `Best: ${result.best}`, style: { fontFamily: FONT_UI, fontSize: 36, fill: COLORS.ink } });
		best.anchor.set(0.5);
		best.y = 20;

		const again = new Button({ label: "PLAY AGAIN", width: 400, height: 110, onTap: ctx.router.toGame });
		again.y = 140;
		const menu = new Button({
			label: "MENU",
			width: 260,
			height: 80,
			color: COLORS.blue,
			shadowColor: COLORS.blueDark,
			onTap: ctx.router.toMenu,
		});
		menu.y = 255;

		panel.addChild(scoreLabel, score, best, again, menu);

		const celebrate = result.isNewBest && result.score > 0;
		if (celebrate) {
			this.badge = new Text({
				text: "NEW BEST!",
				style: { fontFamily: FONT_UI, fontSize: 40, fill: COLORS.white, stroke: { color: COLORS.orangeDark, width: 8, join: "round" } },
			});
			this.badge.anchor.set(0.5);
			this.badge.position.set(PANEL_WIDTH / 2 - 70, -PANEL_HEIGHT / 2 + 10);
			this.badge.rotation = 0.2;
			panel.addChild(this.badge);
		}

		this.player = new Player();
		this.player.position.set(DESIGN_WIDTH / 2, GROUND_Y);
		this.player.pose(celebrate ? "cheer" : "dead");
		if (celebrate) this.player.cheer(Infinity); // keep cheering until the scene ends

		this.addChild(panel, this.player);

		// Pop the panel in: start small, overshoot slightly, settle at full size.
		panel.scale.set(0.6);
		this.tweens.to(panel.scale, { x: 1, y: 1 }, { duration: 0.45, ease: Ease.outBack });
	}

	// No resize(): everything sits inside the guaranteed 720×1280 area, so no layout changes.

	override update(ticker: Ticker): void {
		const dt = ticker.deltaMS / 1000;
		this.time += dt;
		this.tweens.update(dt);
		this.player.update(ticker, null);
		if (this.badge) this.badge.scale.set(1 + Math.sin(this.time * 6) * 0.06);

		if (this.ctx.input.consumePress("Enter", "Space")) this.ctx.router.toGame();
		else if (this.ctx.input.consumePress("Escape")) this.ctx.router.toMenu();
	}
}
