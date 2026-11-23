import { Container, Sprite, Texture } from "pixi.js";
import { BOMB_BLINK_HZ, COIN_SIDE_RATIO, COIN_SPIN_SPEED, ITEM_SCALE } from "./tuning";
import { BOMB, type ItemType } from "./items";

/**
 * One falling thing. Created by a Pool and reused many times: `reset()` must set
 * EVERY field, because the object still holds the values from its previous life.
 */
export class Item extends Container {
	/** What this item currently is. */
	type: ItemType;
	/** Fall speed, units per second. */
	speed = 0;

	private readonly body: Sprite;
	private age = 0;
	private front = Texture.EMPTY;
	private alt = Texture.EMPTY; // side frame (coins) or lit-fuse frame (bombs)

	constructor() {
		super();
		this.type = BOMB; // placeholder until reset(); the item is invisible until then
		this.body = new Sprite();
		this.body.anchor.set(0.5);
		this.addChild(this.body);
		this.visible = false;
	}

	/** Bring the item back to life as `type` at (x, y). */
	reset(type: ItemType, x: number, y: number, speed: number): void {
		this.type = type;
		this.position.set(x, y);
		this.speed = speed;
		this.age = Math.random() * 10; // random phase, so coins don't all spin in sync
		this.front = Texture.from(type.texture);
		const altName = type.sideTexture ?? type.blinkTexture;
		this.alt = altName ? Texture.from(altName) : this.front;
		this.body.texture = this.front;
		this.body.scale.set(ITEM_SCALE);
		this.body.rotation = 0;
		this.visible = true;
	}

	/** Fall and animate for `dt` seconds. */
	update(dt: number): void {
		this.y += this.speed * dt;
		this.age += dt;

		switch (this.type.kind) {
			case "coin": {
				// Fake 3D spin: squash the width by |cos|. When the coin is thinner than the
				// side frame, swap to the side frame so it reads as a coin edge, not a sliver.
				const width = Math.abs(Math.cos(this.age * COIN_SPIN_SPEED));
				const edgeOn = width < COIN_SIDE_RATIO;
				this.body.texture = edgeOn ? this.alt : this.front;
				this.body.scale.x = ITEM_SCALE * (edgeOn ? 1 : width);
				break;
			}
			case "gem":
				this.body.rotation = Math.sin(this.age * 3) * 0.2; // gentle sway
				break;
			case "star":
				this.body.rotation += 2.5 * dt;
				this.body.scale.set(ITEM_SCALE * (1 + 0.08 * Math.sin(this.age * 10)));
				break;
			case "bomb": {
				const lit = Math.floor(this.age * BOMB_BLINK_HZ * 2) % 2 === 0;
				this.body.texture = lit ? this.alt : this.front;
				this.body.rotation = Math.sin(this.age * 7) * 0.12;
				break;
			}
		}
	}
}
