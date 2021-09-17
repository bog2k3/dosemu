import { Tank } from "./tank-entity.js";
import { World } from "./world.js";

export class AbstractController {

	/** @type {Tank} */
	tank = null;
	/** @type {World} */
	world = null;

	/**
	 * @param {Tank} tank
	 * @param {World} world
	*/
	constructor(tank, world) {
		this.tank = tank;
		this.world = world;
	}

	/**@param {number} dt */
	update(dt) {
		throw new Error("Must implement abstract method");
	}

	handleBrickCollision(brick) {

	}
}
