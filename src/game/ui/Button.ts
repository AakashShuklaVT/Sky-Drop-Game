import { Container, Graphics, Text, type DestroyOptions, type FederatedPointerEvent } from "pixi.js";
import { playSfx } from "../../core/Sfx";
import { COLORS, FONT_TITLE } from "../theme";

/** Options for a Button. */
export interface ButtonOptions {
	label: string;
	width: number;
	height: number;
	onTap: () => void;
	color?: number;
	/** Colour of the "3D" lip under the button. */
	shadowColor?: number;
	fontSize?: number;
}

/** How far the face sits above its lip, and how far it sinks when pressed. */
const LIP = 8;
const PRESSED_SCALE = 0.95;

/**
 * A chunky rounded button with a label. Origin = centre.
 * Press feedback: the face shrinks while held, and the action fires on release (pointertap),
 * so sliding your finger off the button cancels it, like native buttons.
 */
export class Button extends Container {
	private readonly caption: Text;
	private readonly onTapHandler: () => void;

	constructor(options: ButtonOptions) {
		super();
		const { width: w, height: h } = options;
		const radius = h * 0.35;

		const face = new Graphics()
			.roundRect(-w / 2, -h / 2 + LIP, w, h, radius)
			.fill(options.shadowColor ?? COLORS.orangeDark)
			.roundRect(-w / 2, -h / 2, w, h, radius)
			.fill(options.color ?? COLORS.orange);
		this.addChild(face);

		this.caption = new Text({
			text: options.label,
			style: {
				fontFamily: FONT_TITLE,
				fontSize: options.fontSize ?? h * 0.45,
				fill: COLORS.white,
				stroke: { color: options.shadowColor ?? COLORS.orangeDark, width: 6, join: "round" },
			},
		});
		this.caption.anchor.set(0.5);
		this.addChild(this.caption);

		this.onTapHandler = options.onTap;
		this.eventMode = "static"; // receives pointer events
		this.cursor = "pointer";
		this.on("pointerdown", this.onDown);
		this.on("pointerup", this.onRelease);
		this.on("pointerupoutside", this.onRelease);
		this.on("pointerleave", this.onRelease);
		this.on("pointertap", this.onTap);
	}

	/** Change the text (e.g. "SOUND: ON" → "SOUND: OFF"). */
	setLabel(text: string): void {
		this.caption.text = text;
	}

	override destroy(options?: DestroyOptions): void {
		this.off("pointerdown", this.onDown);
		this.off("pointerup", this.onRelease);
		this.off("pointerupoutside", this.onRelease);
		this.off("pointerleave", this.onRelease);
		this.off("pointertap", this.onTap);
		super.destroy(options);
	}

	private onDown = (e: FederatedPointerEvent): void => {
		// Stop the event reaching the stage, or Input would also treat this tap as
		// "run toward this finger" and the player would dash to the button.
		e.stopPropagation();
		this.scale.set(PRESSED_SCALE);
	};

	private onRelease = (): void => {
		this.scale.set(1);
	};

	private onTap = (): void => {
		playSfx("select", 0.6);
		this.onTapHandler();
	};
}
