import { BitmapFont } from "pixi.js";

/**
 * Fonts and colours shared by every screen.
 *
 * Font family names come from Pixi's loadWebFont: it turns the FILE name into a family name by
 * splitting on "-"/"_", lower-casing, then capitalising each word:
 *   "LilitaOne-Regular.ttf" → "Lilitaone Regular",  "Fredoka-SemiBold.ttf" → "Fredoka Semibold".
 */
export const FONT_TITLE = "Lilitaone Regular";
export const FONT_UI = "Fredoka Semibold";

/** Name of the bitmap font used for floating "+5" popups (see installBitmapFonts). */
export const FONT_POPUP = "SkyDropPopup";

export const COLORS = {
	ink: 0x2b3a55,
	inkSoft: 0x5d6f8f,
	white: 0xffffff,
	sky: 0xc4e3fe,
	panel: 0xffffff,
	panelEdge: 0xd8e9fb,
	orange: 0xff8a3d,
	orangeDark: 0xc95b17,
	blue: 0x4aa3ff,
	blueDark: 0x2a6fc0,
	gold: 0xffd23f,
	red: 0xff4d4d,
	dim: 0x0d1b2a,
} as const;

/**
 * Bake the popup font into a texture once, after the web fonts are loaded.
 *
 * Why BitmapText for popups: a normal `Text` re-renders its glyphs to a new canvas texture
 * every time its string changes. Popups change text constantly, so we draw each glyph once
 * here and BitmapText just arranges quads: no canvas work, and they batch together.
 */
export function installBitmapFonts(): void {
	BitmapFont.install({
		name: FONT_POPUP,
		chars: [["0", "9"], "+x!"],
		resolution: 2,
		style: {
			fontFamily: FONT_TITLE,
			fontSize: 56,
			fill: COLORS.white, // white, so `tint` can colour each popup
			stroke: { color: COLORS.ink, width: 8, join: "round" },
		},
	});
}
