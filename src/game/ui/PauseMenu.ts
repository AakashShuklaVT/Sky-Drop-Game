import { Container, type Rectangle } from "pixi.js";
import { DESIGN_WIDTH } from "../../core/config";
import type { Settings } from "../context";
import { COLORS } from "../theme";
import { Button } from "./Button";
import { Dimmer, Panel } from "./Panel";

/** What the pause menu can ask the game to do. */
export interface PauseMenuActions {
	onResume: () => void;
	onQuit: () => void;
}

const PANEL_Y = 600;

/** Dimmed overlay with Resume / Sound / Menu. Hidden until the game pauses. */
export class PauseMenu extends Container {
	private readonly dimmer = new Dimmer();

	constructor(settings: Settings, actions: PauseMenuActions) {
		super();
		const panel = new Panel(520, 560, "Paused");
		panel.position.set(DESIGN_WIDTH / 2, PANEL_Y);

		const resume = new Button({ label: "RESUME", width: 380, height: 110, onTap: actions.onResume });
		resume.y = -40;

		const soundLabel = (): string => (settings.muted ? "SOUND: OFF" : "SOUND: ON");
		const sound = new Button({
			label: soundLabel(),
			width: 300,
			height: 80,
			color: COLORS.blue,
			shadowColor: COLORS.blueDark,
			onTap: () => {
				settings.toggleMuted();
				sound.setLabel(soundLabel());
			},
		});
		sound.y = 85;

		const quit = new Button({
			label: "MENU",
			width: 300,
			height: 80,
			color: COLORS.blue,
			shadowColor: COLORS.blueDark,
			onTap: actions.onQuit,
		});
		quit.y = 190;

		panel.addChild(resume, sound, quit);
		this.addChild(this.dimmer, panel);
		this.visible = false;
	}

	/** Cover the whole visible area, bleed included. */
	layout(visible: Rectangle): void {
		this.dimmer.cover(visible);
	}
}
