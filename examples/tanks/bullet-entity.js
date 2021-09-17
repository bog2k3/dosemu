import * as dosemu from "../../src/dosemu.js";
import * as dosemuBBox from "../../src/dosemu-bbox.js";
import { Entity } from "./entity.js";

export class Bullet extends Entity {

	/** @type {{[orientation: string]: Sprite}} */
	static sprites = {};

	speed = 10;
	damage = 15;
	orientation = "";
	identity = "";
	isDead = false;

	constructor(x, y, identity, orientation, speed) {
		super(x, y);
		this.identity = identity;
		this.orientation = orientation;
		this.speed = speed;

		this.enableCollision("Brick");
		this.enableCollision("Tank");
	}

	getType() { return "Bullet"; }

	/** returns the bounding box in world space */
	getBoundingBox() {
		return dosemuBBox.moveBoundingBox(Bullet.sprites[this.orientation].bbox, this.x, this.y);
	}

	update(dt) {
		let dx = 0, dy = 0;
		switch (this.orientation) {
			case "up": dy = -this.speed * dt; break;
			case "down": dy = +this.speed * dt; break;
			case "left": dx = -this.speed * dt; break;
			case "right": dx = +this.speed * dt; break;
		}
		this.move(dx, dy);
		if (this.x < -10 || this.y < -10 || this.x > 330 || this.y > 210) {
			// we're outside the playfield
			this.isDead = true;
		}
	}

	draw() {
		const sprite = Bullet.sprites[this.orientation];
		dosemu.drawSprite(this.x, this.y, sprite);
		this.drawDebug();
	}

	filterCollision(otherEntity) {
		if (otherEntity.getType() === "Tank" && otherEntity.identity === this.identity)
			return false; // don't collide with the tank that fired us
		return true;
	}

	/** @param {Entity} otherEntity */
	handleCollision(otherEntity) {
		switch (otherEntity.getType()) {
			case "Brick":
			case "Tank":
				// destroy the bullet
				this.isDead = true;
				break;
		}
	}
}
