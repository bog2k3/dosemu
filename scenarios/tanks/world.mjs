const BRICK_SIZE = 20;

let drawOnTopQueue = [];

export default {

	BRICK_SIZE: BRICK_SIZE,
	MAP_ROWS: Math.floor(200 / BRICK_SIZE),
	MAP_COLS: Math.floor(320 / BRICK_SIZE),

	/** @type {Tank[]} */
	enemies: [],

	/** @type {Tank} */
	player: null,

	/** @type {Bullet[]} */
	bullets: [],

	/** @type {Brick[]} an array of all bricks */
	bricks: [],

	/** @type {Brick[][]} references to bricks by matrix coordinates */
	brickMatrix: [],

	sounds: {
		tankShoot: {
			enemy: null,
			player: null
		}
	},

	drawOnTop: (fn) => {
		drawOnTopQueue.push(fn);
	},

	drawOnTopExec: () => {
		for (let fn of drawOnTopQueue) {
			fn();
		}
		drawOnTopQueue = [];
	}
};
