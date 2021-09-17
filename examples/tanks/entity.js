import * as dosemu from "../../src/dosemu.js";
import { checkCollision } from "./collision.js";

export class Entity {

	static debugFlags = {
		drawCenterPoint: false,
		drawBBox: false
	}

	x = 0;
	y = 0;
	collisionEnabledEntityTypes = new Set();

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	/** override to return a string representing the class of the entity */
	getType() { throw new Error("Abstract method"); }
	/** @returns {BoundingBox} the entity's bounding box, in world-space */
	getBoundingBox() { throw new Error("Abstract method"); }

	/** should return true if the other entity should be used for collision, or false otherwise.
	 * This is invoked during collision detection step only for entities whose type is already collision-enabled
	 * and allows a more fine-grained control (instance specific) over what collisions should be considered.
	 * @param {Entity} otherEntity
	 */
	filterCollision(otherEntity) {
		return true; // by default, we agree with any other entity.
	}
	/** override to handle collision events with other entities. */
	handleCollision(otherEntity) { }

	/** Call this once to enable collisions between this entity and the given entity type
	 * @param {string} entityType */
	enableCollision(entityType) {
		this.collisionEnabledEntityTypes.add(entityType);
	}

	isCollisionEnabled(entityType) {
		return this.collisionEnabledEntityTypes.has(entityType);
	}

	/**
	 * @param {number} dx
	 * @param {number} dy
	 * @return {void}
	 */
	move(dx, dy) {
		const collisionResult = checkCollision(this, this.getBoundingBox(), dx, dy);
		if (collisionResult.collider) {
			this.handleCollision(collisionResult.collider);
			if (collisionResult.collider.isCollisionEnabled(this.getType())) {
				collisionResult.collider.handleCollision(this);
			}
		}
		this.x += collisionResult.travelX;
		this.y += collisionResult.travelY;
	}

	drawDebug() {
		if (Entity.debugFlags.drawBBox) {
			dosemu.drawBBox(this.getBoundingBox(), 56);
		}
		if (Entity.debugFlags.drawCenterPoint) {
			dosemu.drawBar(this.x - 1, this.y, this.x + 1, this.y, 46);
			dosemu.drawBar(this.x, this.y - 1, this.x, this.y + 1, 46);
		}
	}
}
