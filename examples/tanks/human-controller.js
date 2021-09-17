import { AbstractController } from "./controller.abstract.js";
import * as dosemu from "../../src/dosemu.js";

export class HumanController extends AbstractController {

	/**@param {number} dt */
	update(dt) {
		let playerDx = 0, playerDy = 0;
		if (dosemu.isKeyPressed("ArrowLeft")) {
			playerDx = -this.world.PLAYER_MOVE_SPEED * dt;
		}
		if (dosemu.isKeyPressed("ArrowRight")) {
			playerDx = +this.world.PLAYER_MOVE_SPEED * dt;
		}
		if (dosemu.isKeyPressed("ArrowUp")) {
			playerDy = -this.world.PLAYER_MOVE_SPEED * dt;
		}
		if (dosemu.isKeyPressed("ArrowDown")) {
			playerDy = +this.world.PLAYER_MOVE_SPEED * dt;
		}
		if (playerDx || playerDy) {
			this.tank.move(playerDx, playerDy);
		}
		if (dosemu.isKeyPressed(" ")) {
			this.tank.fire();
		} else {
			this.tank.reload();
		}
	}
}
