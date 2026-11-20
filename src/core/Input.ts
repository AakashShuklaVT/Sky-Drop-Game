import type { Application, Container, FederatedPointerEvent } from "pixi.js";

/**
 * Input = turns raw browser events into simple "what is the user doing right now" state.
 * It knows nothing about the game. Game code reads it once per frame.
 */
export class Input {
	/** X of the finger/mouse in design space while pressed. `null` = not pressing. */
	pointerX: number | null = null;

	private readonly stage: Container;
	private readonly space: Container; // we report positions in THIS container's coordinates
	private readonly keysDown = new Set<string>();
	private activePointerId: number | null = null;

	constructor(app: Application, space: Container) {
		this.stage = app.stage;
		this.space = space;

		// Make the whole canvas listen for pointer events.
		this.stage.eventMode = "static";
		this.stage.hitArea = app.screen;

		this.stage.on("pointerdown", this.onPointerDown);
		this.stage.on("globalpointermove", this.onPointerMove);
		this.stage.on("pointerup", this.onPointerUp);
		this.stage.on("pointerupoutside", this.onPointerUp);

		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.onBlur);
	}

	/** Keyboard direction: -1 = left, 0 = none, 1 = right. */
	get axis(): number {
		const left =
			this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyA");
		const right =
			this.keysDown.has("ArrowRight") || this.keysDown.has("KeyD");
		return Number(right) - Number(left);
	}

	/** Remove every listener. Call when the game/scene is thrown away. */
	destroy(): void {
		this.stage.off("pointerdown", this.onPointerDown);
		this.stage.off("globalpointermove", this.onPointerMove);
		this.stage.off("pointerup", this.onPointerUp);
		this.stage.off("pointerupoutside", this.onPointerUp);

		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.onBlur);
	}

	// ---------- pointer (touch + mouse) ----------

	private onPointerDown = (e: FederatedPointerEvent): void => {
		if (this.activePointerId !== null) return; // already following one finger
		this.activePointerId = e.pointerId;
		this.updatePointerX(e);
	};

	private onPointerMove = (e: FederatedPointerEvent): void => {
		if (e.pointerId !== this.activePointerId) return; // not our finger, or not pressed
		this.updatePointerX(e);
	};

	private onPointerUp = (e: FederatedPointerEvent): void => {
		if (e.pointerId !== this.activePointerId) return;
		this.activePointerId = null;
		this.pointerX = null;
	};

	private updatePointerX(e: FederatedPointerEvent): void {
		this.pointerX = this.space.toLocal(e.global).x; // screen px → design units
	}

	// ---------- keyboard ----------

	private onKeyDown = (e: KeyboardEvent): void => {
		this.keysDown.add(e.code);
	};

	private onKeyUp = (e: KeyboardEvent): void => {
		this.keysDown.delete(e.code);
	};

	/** Window lost focus (alt-tab, notification): we'd miss the key-up, so reset everything. */
	private onBlur = (): void => {
		this.keysDown.clear();
		this.activePointerId = null;
		this.pointerX = null;
	};
}
