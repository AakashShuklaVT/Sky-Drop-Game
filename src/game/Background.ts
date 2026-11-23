import { Container, Texture, TilingSprite, type Rectangle } from "pixi.js";
import { BG_CLOUD_SPEED, BG_TILE_SCALE, BG_TREES_TOP_Y } from "./tuning";

/** Size of one background tile in design units. */
const TILE = 512 * BG_TILE_SCALE;
/** One texel of a tile, in design units. */
const TEXEL = BG_TILE_SCALE;

/**
 * The sky-to-grass backdrop, built from 512 px tiles stacked vertically:
 *
 *   sky     solid blue    ─ fills everything above the clouds (only seen on tall phones)
 *   clouds  blue → white  ─ drifts sideways (parallax)
 *   haze    solid white   ─ hidden filler behind the clouds/trees join
 *   trees   white → hills ─ the horizon
 *   grass   solid green   ─ fills everything below (bleed)
 *
 * Each band is a TilingSprite: one texture repeated across any width, so the backdrop covers
 * the whole visible area (including bleed on wide screens) without stretching.
 * It lives outside the scenes, so the clouds keep drifting across scene changes.
 *
 * Seam fix: a TilingSprite REPEATS its texture, so with smooth (linear) filtering the very top
 * pixel row gets blended with the bottom row and vice versa → a thin line at each band edge.
 * The picture bands (clouds, trees) therefore skip their outermost texel row, and the
 * solid bands (sky, haze, grass) are drawn first, slightly overlapping, to fill the tiny gap.
 */
export class Background extends Container {
	private readonly sky: TilingSprite;
	private readonly haze: TilingSprite;
	private readonly grass: TilingSprite;
	private readonly clouds: TilingSprite;
	private readonly trees: TilingSprite;

	constructor() {
		super();
		const band = (name: string): TilingSprite =>
			new TilingSprite({ texture: Texture.from(name), tileScale: { x: BG_TILE_SCALE, y: BG_TILE_SCALE } });

		this.sky = band("sky");
		this.haze = band("haze");
		this.grass = band("grass");
		this.clouds = band("clouds");
		this.trees = band("trees");
		// Solid fillers first (behind), pictures on top.
		this.addChild(this.sky, this.haze, this.grass, this.clouds, this.trees);
	}

	/** Re-fit every band to the visible area. */
	resize(visible: Rectangle): void {
		const cloudsTop = BG_TREES_TOP_Y - TILE;
		const treesBottom = BG_TREES_TOP_Y + TILE;

		for (const band of [this.sky, this.haze, this.grass, this.clouds, this.trees]) {
			band.x = visible.x;
			band.width = visible.width;
		}

		// Solid fillers: each reaches a little past the picture band it touches.
		this.sky.y = visible.y;
		this.sky.height = Math.max(0, cloudsTop + TILE / 4 - visible.y);
		this.haze.y = BG_TREES_TOP_Y - TILE / 4;
		this.haze.height = TILE / 2;
		this.grass.y = treesBottom - TILE / 4;
		this.grass.height = Math.max(0, visible.bottom - this.grass.y);

		this.placePicture(this.clouds, cloudsTop);
		this.placePicture(this.trees, BG_TREES_TOP_Y);
		// Keep the hills anchored to design x = 0, not to the screen edge,
		// so they don't slide around when the window is resized.
		this.trees.tilePosition.x = -visible.x;
	}

	/** Drift the clouds. */
	update(dt: number): void {
		this.clouds.tilePosition.x -= BG_CLOUD_SPEED * dt;
	}

	/** Show exactly one tile height starting at `top`, minus one texel row at each edge. */
	private placePicture(band: TilingSprite, top: number): void {
		band.y = top + TEXEL;
		band.height = TILE - 2 * TEXEL;
		band.tilePosition.y = -TEXEL; // so the visible part still lines up with `top`
	}
}
