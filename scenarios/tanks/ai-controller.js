import { Brick } from "./brick-entity.js";
import { AbstractController } from "./controller.abstract.js";

export class AIController extends AbstractController {

	/**
	 * @type {{
	 * 	type: "move-left" | "move-right" | "move-up" | "move-down" | "fire",
	 * 	remainingTime: number
	 * }}
	 **/
	plannedAction = null;

	/**@param {number} dt */
	update(dt) {
		if (this.plannedAction) {
			this.executePlannedAction(dt);
			this.plannedAction.remainingTime -= dt;
			if (this.plannedAction.remainingTime <= 0) {
				this.plannedAction = null;
			}
			return;
		}
		// randomly fire:
		if (Math.random() < 0.05) {
			this.tank.fire();
		}
		const distToPlayer = distance(this.tank, this.world.player);
		const awarenessRadius = 100;
		if (distToPlayer <= awarenessRadius && Math.random() < 0.5) {
			// tank decides to go toward player
			if (this.isTankInlineWithPlayer() && this.isTankOrientedTowardPlayer() && Math.random() < 0.8) {
				// player is in sight, tank might choose to shoot
				this.planFire();
			} else {
				this.planMoveTowardPlayer();
			}
		} else {
			// just fool around
			this.planFoolAround();
		}
	}

	/** @private */
	executePlannedAction(dt) {
		switch (this.plannedAction.type) {
			case "fire":
				this.tank.fire();
			case "move-down":
				this.tank.move(0, this.world.AI_MOVE_SPEED * dt);
				break;
			case "move-up":
				this.tank.move(0, -this.world.AI_MOVE_SPEED * dt);
				break;
			case "move-left":
				this.tank.move(-this.world.AI_MOVE_SPEED * dt, 0);
				break;
			case "move-right":
				this.tank.move(this.world.AI_MOVE_SPEED * dt, 0);
				break;
			case "idle":
				break;
		}
	}

	/** @private @return {boolean} */
	isTankInlineWithPlayer() {
		const dx = Math.abs(this.world.player.x - this.tank.x);
		const dy = Math.abs(this.world.player.y - this.tank.y);
		return dx < this.world.BRICK_SIZE || dy < this.world.BRICK_SIZE;
	}

	/** @private @return {boolean} */
	isTankOrientedTowardPlayer() {
		return this.tank.orientation === this.getOrientationTowardPlayer();
	}

	/** @private @return {"up" | "down" | "left" | "right"}*/
	getOrientationTowardPlayer() {
		const dx = this.world.player.x - this.tank.x;
		const dy = this.world.player.y - this.tank.y;
		if (Math.abs(dx) >= Math.abs(dy)) {
			return dx > 0 ? "right" : "left";
		} else {
			return dy > 0 ? "down" : "up";
		}
	}

	/** @private @return {void} */
	planFire() {
		this.plannedAction = {
			type: "fire",
			remainingTime: 3.0
		};
	}

	/** @private @return {void} */
	planMoveTowardPlayer() {
		this.plannedAction = {
			type: `move-${this.getOrientationTowardPlayer()}`,
			remainingTime: 1.0
		};
	}

	/** @private @return {void} */
	planFoolAround() {
		const directions = ["up", "down", "left", "right"];
		if (Math.random() < 0.5) {
			// change direction
			this.tank.orientation = directions[Math.floor(Math.random() * 4)];
		}
		if (Math.random() < 0.8) {
			this.plannedAction = {
				type: `move-${this.tank.orientation}`,
				remainingTime: 1.0
			};
		} else {
			this.plannedAction = {
				type: "idle",
				remainingTime: 1.0
			}
		}
	}

	/**
	 * @param {Brick} brick
	 * @return {void} */
	handleBrickCollision(brick) {

	}
}

function distance(e1, e2) {
	const dx = e1.x - e2.x;
	const dy = e1.y - e2.y;
	return Math.sqrt(dx*dx + dy*dy);
}
