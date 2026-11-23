import { Container, Sprite, Texture } from "pixi.js";

/** How the string is placed relative to the container's origin. */
export type TextAlign = "left" | "center" | "right";

/** Options for a SpriteNumber. */
export interface SpriteNumberOptions {
	/** Maps one character to a texture name, e.g. "7" → "digit_7". */
	frameFor: (char: string) => string;
	/** Distance between two character centres, in the texture's own pixels. */
	advance: number;
	align?: TextAlign;
}

/**
 * Shows a short string ("1250", "x3") using one sprite per character from a spritesheet.
 *
 * Sprites are reused between updates (extra ones are just hidden), so changing the
 * value every frame allocates nothing. Characters are spaced by a fixed `advance`
 * (monospaced), so the score doesn't wobble as digits change.
 */
export class SpriteNumber extends Container {
	private readonly glyphs: Sprite[] = [];
	private readonly frameFor: (char: string) => string;
	private readonly advance: number;
	private readonly align: TextAlign;
	private current = "";

	constructor(options: SpriteNumberOptions) {
		super();
		this.frameFor = options.frameFor;
		this.advance = options.advance;
		this.align = options.align ?? "left";
	}

	/** The string currently shown. */
	get text(): string {
		return this.current;
	}

	set text(value: string) {
		if (value === this.current) return; // nothing to do: most frames hit this
		this.current = value;

		// Grow the sprite list if this string is longer than any before.
		while (this.glyphs.length < value.length) {
			const glyph = new Sprite();
			glyph.anchor.set(0.5);
			this.glyphs.push(glyph);
			this.addChild(glyph);
		}

		const width = value.length * this.advance;
		const startX =
			this.align === "left" ? 0 : this.align === "center" ? -width / 2 : -width;

		this.glyphs.forEach((glyph, i) => {
			const char = value[i];
			glyph.visible = char !== undefined;
			if (char === undefined) return;
			glyph.texture = Texture.from(this.frameFor(char));
			glyph.x = startX + (i + 0.5) * this.advance;
		});
	}
}
