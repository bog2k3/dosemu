import * as dosemu from "../../lib/dosemu.mjs";
import * as dosemuBBox from "../../lib/dosemu-bbox.mjs";
import * as dosemuSound from "../../lib/dosemu-sound.mjs";
import { Entity } from "./entity.mjs";
import world from "./world.mjs";
import { Bullet } from "./bullet-entity.mjs";

export class Tank extends Entity {

	/** @type {{[orientation: string]: Sprite}} */
	sprites = {};
	/** @type {"up", "down", "left", "right"} */
	orientation = "up";
	timeSinceLastFire = 100;
	fireInterval = 0.6;
	/** @type {"player" | "enemy"} */
	identity = "";
	bulletSpeed = 150;
	health = 100;

	constructor(sprites, x, y, orientation, identity) {
		super(x, y);
		this.sprites = sprites;
		this.orientation = orientation;
		this.identity = identity;

		this.enableCollision("Bullet");
		this.enableCollision("Brick");
		this.enableCollision("Tank");
	}

	getType() { return "Tank"; }

	/** returns the bounding box in world space */
	getBoundingBox() {
		return dosemuBBox.moveBoundingBox(this.sprites[this.orientation].bbox, this.x, this.y);
	}

	draw() {
		dosemu.drawSprite(this.x, this.y, this.sprites[this.orientation]);
		world.drawOnTop(() => {
			this.drawHealthBar();
		});
		this.drawDebug();
	}

	drawHealthBar() {
		if (this.health < 0) {
			return;
		}
		const width = 18;
		const height = 2;
		const offs = 3;
		const colors = [1, 172, 11, 154, 10];
		let color = colors[Math.floor(this.health / 100 * (colors.length - 1))];
		const barY = this.y + this.sprites["up"].height - this.sprites["up"].originY + offs;
		const length = Math.floor(width * this.health / 100);
		dosemu.drawBar(this.x - length / 2, barY, this.x + length / 2 - 1, barY + height, color);
	}

	update(dt) {
		this.timeSinceLastFire += dt;
	}

	fire() {
		if (this.timeSinceLastFire >= this.fireInterval) {
			// create bullet
			const [bx, by] = this.getBulletFiringPosition();
			world.bullets.push(new Bullet(bx, by, this.identity, this.orientation, this.bulletSpeed));
			this.timeSinceLastFire = 0;

			dosemuSound.sound(world.sounds.tankShoot[this.identity]);
		}
	}

	reload() {
		this.timeSinceLastFire = Math.max(this.timeSinceLastFire, this.fireInterval / 2);
	}

	getBulletFiringPosition() {
		const offs = this.sprites["up"].height / 2;
		switch (this.orientation) {
			case "up": return [this.x, this.y - offs];
			case "down": return [this.x, this.y + offs];
			case "left": return [this.x - offs, this.y];
			case "right": return [this.x + offs, this.y];
		}
	}

	/** @param {Entity} otherEntity */
	handleCollision(otherEntity) {
		switch (otherEntity.getType()) {
			case "Bullet":
				if (otherEntity.identity !== this.identity) {
					// take damage
					this.health -= otherEntity.damage;
				}
				break;
		}
	}
}
