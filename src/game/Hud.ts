import { Container, Sprite, Texture, type Rectangle } from "pixi.js";
import { DESIGN_WIDTH } from "../core/config";
import { SpriteNumber } from "../core/SpriteNumber";
import { Ease, type Tweens } from "../core/Tweens";
import { Button } from "./ui/Button";
import { COLORS } from "./theme";
import {
	HUD_BUTTON_SIZE,
	HUD_COMBO_SCALE,
	HUD_DIGIT_ADVANCE,
	HUD_DIGIT_SCALE,
	HUD_HEART_SCALE,
	HUD_HEART_SPACING,
	HUD_MARGIN,
	START_LIVES,
} from "./tuning";

/**
 * Heads-up display: hearts (left), coin + score (centre), pause (right), combo under the score.
 *
 *   ♥ ♥ ♡        (coin) 1250        [II]
 *                     x3
 *
 * It only DISPLAYS numbers it is given; ScoreKeeper owns the real values.
 */
export class Hud extends Container {
	private readonly hearts: Sprite[] = [];
	private readonly heartRow = new Container();
	private readonly scoreGroup = new Container();
	private readonly score: SpriteNumber;
	private readonly combo: SpriteNumber;
	private readonly pauseButton: Button;
	private readonly tweens: Tweens;
	private lives = START_LIVES;
	private multiplier = 1;

	/**
	 * @param tweens The scene's tween engine (so HUD animations pause with the game).
	 * @param onPause Called when the pause button is tapped.
	 */
	constructor(tweens: Tweens, onPause: () => void) {
		super();
		this.tweens = tweens;

		for (let i = 0; i < START_LIVES; i++) {
			const heart = new Sprite(Texture.from("heart"));
			heart.anchor.set(0.5);
			heart.scale.set(HUD_HEART_SCALE);
			heart.x = i * HUD_HEART_SPACING;
			this.hearts.push(heart);
			this.heartRow.addChild(heart);
		}

		const coin = new Sprite(Texture.from("coin_icon"));
		coin.anchor.set(0.5);
		coin.scale.set(HUD_HEART_SCALE);
		this.score = new SpriteNumber({ frameFor: (c) => `digit_${c}`, advance: HUD_DIGIT_ADVANCE, align: "left" });
		this.score.scale.set(HUD_DIGIT_SCALE);
		this.score.x = 34;
		this.score.text = "0";
		this.scoreGroup.addChild(coin, this.score);

		this.combo = new SpriteNumber({ frameFor: (c) => `digit_${c}`, advance: HUD_DIGIT_ADVANCE, align: "center" });
		this.combo.scale.set(HUD_COMBO_SCALE);
		this.combo.visible = false;

		this.pauseButton = new Button({
			label: "II",
			width: HUD_BUTTON_SIZE,
			height: HUD_BUTTON_SIZE,
			color: COLORS.blue,
			shadowColor: COLORS.blueDark,
			onTap: onPause,
		});

		this.addChild(this.heartRow, this.scoreGroup, this.combo, this.pauseButton);
	}

	/** Pin everything to the top of the SAFE area, but inside the 720-wide play column. */
	layout(safe: Rectangle): void {
		const left = Math.max(safe.left, 0) + HUD_MARGIN;
		const right = Math.min(safe.right, DESIGN_WIDTH) - HUD_MARGIN;
		const rowY = safe.top + HUD_MARGIN + HUD_BUTTON_SIZE / 2;

		this.heartRow.position.set(left + 24, rowY);
		this.scoreGroup.position.set(DESIGN_WIDTH / 2 - 60, rowY);
		this.combo.position.set(DESIGN_WIDTH / 2, rowY + 70);
		this.pauseButton.position.set(right - HUD_BUTTON_SIZE / 2, rowY);
	}

	/** Show the score, with a little bump when it changes. */
	setScore(value: number): void {
		this.score.text = String(value);
		this.pop(this.score, HUD_DIGIT_SCALE, 1.25);
	}

	/** Show full/empty hearts. A lost heart pops. */
	setLives(lives: number): void {
		this.hearts.forEach((heart, i) => {
			heart.texture = Texture.from(i < lives ? "heart" : "heart_empty");
			if (i >= lives && i < this.lives) this.pop(heart, HUD_HEART_SCALE, 1.6);
		});
		this.lives = lives;
	}

	/** Show "x2", "x3"… or hide at ×1. */
	setCombo(multiplier: number): void {
		if (multiplier === this.multiplier) return;
		this.multiplier = multiplier;
		this.combo.visible = multiplier > 1;
		this.combo.text = `x${multiplier}`;
		if (multiplier > 1) this.pop(this.combo, HUD_COMBO_SCALE, 1.6);
	}

	/** Scale up instantly, then ease back to `rest`. */
	private pop(target: Container, rest: number, factor: number): void {
		this.tweens.killTweensOf(target.scale);
		target.scale.set(rest * factor);
		this.tweens.to(target.scale, { x: rest, y: rest }, { duration: 0.3, ease: Ease.outBack });
	}
}
