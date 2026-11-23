import { Container, Graphics, Text, type DestroyOptions, type FederatedPointerEvent } from "pixi.js";
import { COLORS, FONT_TITLE } from "../theme";

/**
 * A white rounded card with a title, used by the pause and game-over screens.
 * Origin = centre of the card; put content at y offsets from 0.
 */
export class Panel extends Container {
	/** Height of the card, for laying out content. */
	readonly panelHeight: number;

	constructor(width: number, height: number, title: string) {
		super();
		this.panelHeight = height;
		const r = 40;

		const card = new Graphics()
			.roundRect(-width / 2, -height / 2 + 12, width, height, r)
			.fill({ color: COLORS.dim, alpha: 0.25 }) // soft drop shadow
			.roundRect(-width / 2, -height / 2, width, height, r)
			.fill(COLORS.panel)
			.stroke({ width: 8, color: COLORS.panelEdge, alignment: 1 });
		this.addChild(card);

		const heading = new Text({
			text: title,
			style: {
				fontFamily: FONT_TITLE,
				fontSize: 76,
				fill: COLORS.orange,
				stroke: { color: COLORS.orangeDark, width: 4, join: "round" },
			},
		});
		heading.anchor.set(0.5);
		heading.y = -height / 2 + 80;
		this.addChild(heading);
	}
}

/**
 * Full-screen dark layer behind a panel. It is interactive and swallows taps,
 * so touching "nothing" while a panel is open doesn't move the player underneath.
 */
export class Dimmer extends Graphics {
	constructor() {
		super();
		this.eventMode = "static";
		this.on("pointerdown", this.swallow);
	}

	override destroy(options?: DestroyOptions): void {
		this.off("pointerdown", this.swallow);
		super.destroy(options);
	}

	private swallow = (e: FederatedPointerEvent): void => {
		e.stopPropagation();
	};

	/** Cover `area` (call from the owner's resize). */
	cover(area: { x: number; y: number; width: number; height: number }): void {
		this.clear().rect(area.x, area.y, area.width, area.height).fill({ color: COLORS.dim, alpha: 0.55 });
	}
}
