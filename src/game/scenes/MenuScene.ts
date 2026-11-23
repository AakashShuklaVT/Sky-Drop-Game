import { Text, type Rectangle, type Ticker } from "pixi.js";
import { DESIGN_WIDTH } from "../../core/config";
import { Scene } from "../../core/Scene";
import { loadNumber } from "../../core/storage";
import type { GameContext } from "../context";
import { Player, type MoveInput } from "../Player";
import { COLORS, FONT_TITLE, FONT_UI } from "../theme";
import { GROUND_Y, STORAGE_BEST } from "../tuning";
import { Button } from "../ui/Button";

/** Where the demo player strolls between, and how long she waits at each end. */
const DEMO_STOPS = [190, 530];
const DEMO_WAIT_SECONDS = 1.4;

/**
 * Title screen. The player walks back and forth on her own: the scene feeds her a scripted
 * MoveInput instead of the real Input, so the same Player class works here unchanged.
 */
export class MenuScene extends Scene {
	private readonly ctx: GameContext;
	private readonly title: Text;
	private readonly player: Player;
	private readonly playButton: Button;
	private readonly soundButton: Button;
	private readonly demoInput: { pointerX: number | null; axis: number } = { pointerX: null, axis: 0 };
	private demoStop = 0;
	private demoWait = DEMO_WAIT_SECONDS;
	private time = 0;
	private titleY = 270;

	constructor(ctx: GameContext) {
		super();
		this.ctx = ctx;

		this.title = new Text({
			text: "Sky Drop",
			style: {
				fontFamily: FONT_TITLE,
				fontSize: 132,
				fill: COLORS.white,
				stroke: { color: COLORS.blueDark, width: 12, join: "round" },
				dropShadow: { color: COLORS.dim, alpha: 0.25, blur: 0, distance: 8, angle: Math.PI / 2 },
			},
		});
		this.title.anchor.set(0.5);

		const tagline = new Text({
			text: "Catch the coins · Dodge the bombs",
			style: { fontFamily: FONT_UI, fontSize: 32, fill: COLORS.ink },
		});
		tagline.anchor.set(0.5);
		tagline.position.set(DESIGN_WIDTH / 2, 420);

		const best = new Text({
			text: `Best: ${loadNumber(STORAGE_BEST, 0)}`,
			style: { fontFamily: FONT_UI, fontSize: 38, fill: COLORS.ink },
		});
		best.anchor.set(0.5);
		best.position.set(DESIGN_WIDTH / 2, 500);

		this.playButton = new Button({ label: "PLAY", width: 360, height: 130, onTap: ctx.router.toGame });
		this.playButton.position.set(DESIGN_WIDTH / 2, 660);

		this.soundButton = new Button({
			label: this.soundLabel(),
			width: 300,
			height: 84,
			color: COLORS.blue,
			shadowColor: COLORS.blueDark,
			onTap: () => {
				ctx.settings.toggleMuted();
				this.soundButton.setLabel(this.soundLabel());
			},
		});
		this.soundButton.position.set(DESIGN_WIDTH / 2, 810);

		const hint = new Text({
			text: "Drag, or use the arrow keys / A D",
			style: { fontFamily: FONT_UI, fontSize: 28, fill: COLORS.inkSoft },
		});
		hint.anchor.set(0.5);
		hint.position.set(DESIGN_WIDTH / 2, 910);

		this.player = new Player();
		this.player.position.set(DESIGN_WIDTH / 2, GROUND_Y);

		this.addChild(this.title, tagline, best, this.playButton, this.soundButton, hint, this.player);
	}

	override resize(_visible: Rectangle, safe: Rectangle): void {
		// Keep the title clear of a notch on tall phones.
		this.titleY = Math.max(270, safe.top + 150);
		this.title.position.set(DESIGN_WIDTH / 2, this.titleY);
	}

	override update(ticker: Ticker): void {
		const dt = ticker.deltaMS / 1000;
		this.time += dt;
		this.title.y = this.titleY + Math.sin(this.time * 2) * 8; // gentle float
		this.title.rotation = Math.sin(this.time * 1.3) * 0.03;

		if (this.ctx.input.consumePress("Enter", "Space")) {
			this.ctx.router.toGame();
			return;
		}

		this.updateDemo(dt);
		this.player.update(ticker, this.demoInput satisfies MoveInput);
	}

	/** Walk to a stop, wait, walk to the other stop… */
	private updateDemo(dt: number): void {
		const target = DEMO_STOPS[this.demoStop] ?? DESIGN_WIDTH / 2;
		if (this.demoInput.pointerX === null) {
			this.demoWait -= dt;
			if (this.demoWait <= 0) this.demoInput.pointerX = target;
		} else if (Math.abs(this.player.x - target) < 1) {
			this.demoInput.pointerX = null;
			this.demoWait = DEMO_WAIT_SECONDS;
			this.demoStop = (this.demoStop + 1) % DEMO_STOPS.length;
			this.player.cheer(0.6);
		}
	}

	private soundLabel(): string {
		return this.ctx.settings.muted ? "SOUND: OFF" : "SOUND: ON";
	}
}
