import { Graphics, Text, type Rectangle } from "pixi.js";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../../core/config";
import { Scene } from "../../core/Scene";
import { COLORS, FONT_TITLE, FONT_UI } from "../theme";

const BAR_WIDTH = 440;
const BAR_HEIGHT = 34;

/**
 * Shown while the "game" bundle downloads. It may only use things that are already loaded:
 * Graphics and the web fonts (main.ts loads the small "fonts" bundle before showing this).
 */
export class LoadingScene extends Scene {
	private readonly backdrop = new Graphics();
	private readonly bar = new Graphics();
	private readonly status: Text;
	private progress = 0;

	constructor() {
		super();

		const title = new Text({
			text: "Sky Drop",
			style: { fontFamily: FONT_TITLE, fontSize: 110, fill: COLORS.white, stroke: { color: COLORS.blueDark, width: 10, join: "round" } },
		});
		title.anchor.set(0.5);
		title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.38);

		this.status = new Text({ text: "Loading… 0%", style: { fontFamily: FONT_UI, fontSize: 34, fill: COLORS.ink } });
		this.status.anchor.set(0.5);
		this.status.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.5 + 70);

		this.bar.position.set(DESIGN_WIDTH / 2 - BAR_WIDTH / 2, DESIGN_HEIGHT * 0.5);
		this.addChild(this.backdrop, title, this.bar, this.status);
		this.drawBar();
	}

	/** 0..1, straight from Assets.loadBundle's progress callback. */
	setProgress(value: number): void {
		this.progress = value;
		this.status.text = `Loading… ${Math.round(value * 100)}%`;
		this.drawBar();
	}

	override resize(visible: Rectangle): void {
		this.backdrop.clear().rect(visible.x, visible.y, visible.width, visible.height).fill(COLORS.sky);
	}

	private drawBar(): void {
		const r = BAR_HEIGHT / 2;
		this.bar
			.clear()
			.roundRect(0, 0, BAR_WIDTH, BAR_HEIGHT, r)
			.fill({ color: COLORS.white, alpha: 0.8 })
			.roundRect(4, 4, Math.max(BAR_HEIGHT - 8, (BAR_WIDTH - 8) * this.progress), BAR_HEIGHT - 8, r - 4)
			.fill(COLORS.orange);
	}
}
