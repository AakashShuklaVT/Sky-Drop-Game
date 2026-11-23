import type { Weighted } from "../core/math";

/** What kind of thing fell: decides scoring, sound and animation. */
export type ItemKind = "coin" | "gem" | "star" | "bomb";

/** Static description of one item type. Data only: no Pixi objects in here. */
export interface ItemType extends Weighted {
	readonly id: string;
	readonly kind: ItemKind;
	/** Frame name in the items spritesheet. */
	readonly texture: string;
	/** Coins only: the edge-on frame used mid-spin. */
	readonly sideTexture?: string;
	/** Bombs only: the lit-fuse frame it blinks to. */
	readonly blinkTexture?: string;
	/** Base points before the combo multiplier. */
	readonly points: number;
	/** Collision radius in design units (smaller than the art for bombs, to keep dodging fair). */
	readonly radius: number;
	/** Sound alias played on catch. */
	readonly sound: string;
	/** Particle / popup colour. */
	readonly color: number;
}

/** Everything worth catching. `weight` = how often it spawns relative to the others. */
export const GOOD_ITEMS: readonly ItemType[] = [
	{ id: "coin_bronze", kind: "coin", texture: "coin_bronze", sideTexture: "coin_bronze_side", points: 1, radius: 34, sound: "coin", color: 0xe0904a, weight: 50 },
	{ id: "coin_silver", kind: "coin", texture: "coin_silver", sideTexture: "coin_silver_side", points: 2, radius: 34, sound: "coin", color: 0xdfe7ef, weight: 26 },
	{ id: "coin_gold", kind: "coin", texture: "coin_gold", sideTexture: "coin_gold_side", points: 5, radius: 34, sound: "coin", color: 0xffd23f, weight: 10 },
	{ id: "gem_blue", kind: "gem", texture: "gem_blue", points: 10, radius: 34, sound: "gem", color: 0x4aa3ff, weight: 2 },
	{ id: "gem_green", kind: "gem", texture: "gem_green", points: 10, radius: 34, sound: "gem", color: 0x4ade80, weight: 2 },
	{ id: "gem_red", kind: "gem", texture: "gem_red", points: 10, radius: 34, sound: "gem", color: 0xff5a5a, weight: 2 },
	{ id: "gem_yellow", kind: "gem", texture: "gem_yellow", points: 10, radius: 34, sound: "gem", color: 0xffe066, weight: 2 },
	{ id: "star", kind: "star", texture: "star", points: 3, radius: 36, sound: "magic", color: 0xfff3a0, weight: 4 },
];

/** The one thing to avoid. Spawn chance is decided by difficulty, not by weight. */
export const BOMB: ItemType = {
	id: "bomb",
	kind: "bomb",
	texture: "bomb",
	blinkTexture: "bomb_active",
	points: 0,
	radius: 28,
	sound: "hurt",
	color: 0xff8a3d,
	weight: 0,
};
