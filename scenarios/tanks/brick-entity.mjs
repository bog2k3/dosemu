import * as dosemu from "../../lib/dosemu.mjs";
import * as dosemuBBox from "../../lib/dosemu-bbox.mjs";
import { Entity } from "./entity.mjs";

export class Brick extends Entity {

	/** @type {Sprite[]} sprites for each brick type */
	static sprites = [];

	type = 1;
	isDead = false;

	constructor(type, x, y) {
		super(x, y);
		this.type = type;
		this.enableCollision("Bullet");
	}

	getType() { return "Brick"; }

	/** returns the bounding box in world space */
	getBoundingBox() {
		return dosemuBBox.moveBoundingBox(Brick.sprites[this.type - 1].bbox, this.x, this.y);
	}

	draw() {
		dosemu.drawSprite(this.x, this.y, Brick.sprites[this.type - 1]);
		this.drawDebug();
	}

	/** @param {Entity} otherEntity */
	handleCollision(otherEntity) {
		if (otherEntity.getType() === "Bullet" && this.type === 1) {
			this.break();
		}
	}

	/** breaks the brick into pieces */
	break() {
		// TODO play animation
		this.isDead = true;
	}
}
