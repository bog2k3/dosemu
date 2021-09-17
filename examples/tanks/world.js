const BRICK_SIZE = 20;

export class World {

	BRICK_SIZE = BRICK_SIZE;
	MAP_ROWS = Math.floor(200 / BRICK_SIZE);
	MAP_COLS = Math.floor(320 / BRICK_SIZE);

	PLAYER_MOVE_SPEED = 30; // pixels per second
	AI_MOVE_SPEED = 10; // px/s

	/** @type {Tank[]} */
	enemies = [];

	/** @type {Tank} */
	player = null;

	/** @type {Bullet[]} */
	bullets = [];

	/** @type {Brick[]} an array of all bricks */
	bricks = [];

	/** @type {Brick[][]} references to bricks by matrix coordinates */
	brickMatrix = [];

	/** @private @type {(()=>void)[]}*/
	drawOnTopQueue = [];

	sounds = {
		tankShoot: {
			enemy: null,
			player: null
		}
	};

	/** @param {() => void} fn the draw function to be invoked on top of the regular drawing */
	drawOnTop(fn) {
		this.drawOnTopQueue.push(fn);
	};

	drawOnTopExec = () => {
		for (let fn of this.drawOnTopQueue) {
			fn();
		}
		this.drawOnTopQueue = [];
	}
};

export const world = new World();
