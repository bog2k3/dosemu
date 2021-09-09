import * as dosemu from "../lib/dosemu.mjs";
import * as dosemuSound from "../lib/dosemu-sound.mjs";
import * as dosemuSprite from "../lib/dosemu-sprite.mjs";
import * as dosemuBBox from "../lib/dosemu-bbox.mjs";
import playerTankSprite from "./data/tank-sprite-player.png.mjs";
import enemyTankSpriteA from "./data/tank-sprite-enemy-a.png.mjs";
import enemyTankSpriteB from "./data/tank-sprite-enemy-b.png.mjs";
import enemyTankSpriteC from "./data/tank-sprite-enemy-c.png.mjs";
import enemyTankSpriteD from "./data/tank-sprite-enemy-d.png.mjs";
import bulletSprite from "./data/bullet-sprite.png.mjs";
import brickSprite1 from "./data/brick-sprite1.png.mjs";
import { BoundingBox } from "../lib/dosemu-bbox.mjs";

/** @type {{[orientation: string]: Sprite}} */
const playerTankSprites = {};
/** @type {Sprite[]} */
const enemyTankSprites = [];
/** @type {Sprite[]} */
const brickSprites = [];
/** @type {{[orientation: string]: Sprite}} */
const bulletSprites = {};

/** @type {Tank[]} */
const enemies = [];

/** @type {Tank} */
let player = null;

/** @type {Bullet[]} */
const bullets = [];

/** @type {Brick[]} an array of all bricks */
const bricks = [];
/** @type {Brick[][]} references to bricks by matrix coordinates */
const brickMatrix = [];

/** @type {{[identity: string]: number[][]}} */
const shootSounds = {};

const BRICK_SIZE = 20;
const MAP_ROWS = Math.floor(200 / BRICK_SIZE);
const MAP_COLS = Math.floor(320 / BRICK_SIZE);

/** map should be of MAP_ROWS * MAP_COLS size
 * each cell contains a number with these meanings:
 * 	0 - empty
 * 	1..4 - brick type
 * 	5..8 - enemy type
 * 	9 - player
 */
const map = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
	[1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1],
	[1, 0, 5, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 5, 0, 1],
	[1, 0, 0, 0, 1, 0, 0, 9, 0, 0, 1, 0, 1, 1, 1, 1],
	[1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
	[1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
	[1, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 6, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

export function init() {
	buildSpriteCollections();
	buildSounds();
	placeEntities();
}

export function draw() {
	for (let bullet of bullets) {
		bullet.draw();
	}
	player.draw();
	for (let enemy of enemies) {
		enemy.draw();
	}
	for (let brick of bricks) {
		brick.draw();
	}
}

export function update(dt) {
	handlePlayerKeys(dt);
	for (let enemy of enemies) {
		enemy.update(dt);
	}
	player.update(dt);
	for (let i = 0; i < bullets.length;) {
		bullets[i].update(dt);
		if (bullets[i].isDead) {
			bullets.splice(i, 1);
		} else {
			i++;
		}
	}
}

function placeEntities() {
	for (let i = 0; i < MAP_ROWS; i++) {
		brickMatrix[i] = [];
		for (let j = 0; j < MAP_COLS; j++) {
			const x = j * BRICK_SIZE;
			const y = i * BRICK_SIZE;
			const code = map[i][j];
			if (code >= 1 && code <= 4) {
				bricks.push(new Brick(code, x, y));
				brickMatrix[i][j] = bricks[bricks.length-1];
			}
			if (code >= 5 && code <= 8) {
				enemies.push(new Tank(enemyTankSprites[code-5], x + BRICK_SIZE/2, y + BRICK_SIZE/2, "up", "enemy"));
			}
			if (code === 9) {
				createPlayer(x + BRICK_SIZE/2, y + BRICK_SIZE/2);
			}
		}
	}
}

function createPlayer(x, y) {
	player = new Tank(playerTankSprites, x, y, "up", "player");
}

function handlePlayerKeys(dt) {
	const playerMoveSpeed = 30; // px/sec
	let playerDx = 0, playerDy = 0;
	if (dosemu.isKeyPressed("ArrowLeft")) {
		if (player.orientation == "left") {
			playerDx = -playerMoveSpeed * dt;
		} else {
			player.orientation = "left";
		}
	}
	if (dosemu.isKeyPressed("ArrowRight")) {
		if (player.orientation == "right") {
			playerDx = +playerMoveSpeed * dt;
		} else {
			player.orientation = "right";
		}
	}
	if (dosemu.isKeyPressed("ArrowUp")) {
		if (player.orientation == "up") {
			playerDy = -playerMoveSpeed * dt;
		} else {
			player.orientation = "up";
		}
	}
	if (dosemu.isKeyPressed("ArrowDown")) {
		if (player.orientation == "down") {
			playerDy = +playerMoveSpeed * dt;
		} else {
			player.orientation = "down";
		}
	}
	if (playerDx || playerDy) {
		player.move(playerDx, playerDy);
	}
	if (dosemu.isKeyPressed(" ")) {
		player.fire();
	} else {
		player.reload();
	}
}

function buildSpriteCollections() {
	playerTankSprites["up"] = playerTankSprite;
	playerTankSprites["right"] = dosemuSprite.rotateSprite(playerTankSprite, 1);
	playerTankSprites["down"] = dosemuSprite.rotateSprite(playerTankSprite, 2);
	playerTankSprites["left"] = dosemuSprite.rotateSprite(playerTankSprite, 3);

	const enemyTankSpriteList = [enemyTankSpriteA, enemyTankSpriteB, enemyTankSpriteC, enemyTankSpriteD];
	for (let enemySprite of enemyTankSpriteList) {
		const spriteSet = {}
		spriteSet["up"] = enemySprite;
		spriteSet["right"] = dosemuSprite.rotateSprite(enemySprite, 1);
		spriteSet["down"] = dosemuSprite.rotateSprite(enemySprite, 2);
		spriteSet["left"] = dosemuSprite.rotateSprite(enemySprite, 3);
		enemyTankSprites.push(spriteSet);
	}

	bulletSprites["up"] = bulletSprite;
	bulletSprites["right"] = dosemuSprite.rotateSprite(bulletSprite, 1);
	bulletSprites["down"] = dosemuSprite.rotateSprite(bulletSprite, 2);
	bulletSprites["left"] = dosemuSprite.rotateSprite(bulletSprite, 3);

	for (let orientation of ["up", "down", "left", "right"]) {
		dosemuSprite.computeBoundingBox(playerTankSprites[orientation]);
		dosemuSprite.computeBoundingBox(bulletSprites[orientation]);
		for (let i=0; i<enemyTankSprites.length; i++)
			dosemuSprite.computeBoundingBox(enemyTankSprites[i][orientation]);
	}

	const brickSpriteList = [brickSprite1];
	for (let brickSprite of brickSpriteList) {
		dosemuSprite.computeBoundingBox(brickSprite);
		brickSprites.push(brickSprite);
	}
}

function buildSounds() {
	shootSounds["player"] = [[0, 0.01], [50, 0.05], [10, 0.05], [50, 0.05], [10, 0.05]];
	shootSounds["enemy"] = [[0, 0.01], [50, 0.05], [500, 0.01], [50, 0.05], [500, 0.01]];
}

function clamp(x, a, b) {
	if (x < a) x = a;
	if (x > b) x = b;
	return x;
}

/** checks a bounding box at a position against collisions with world objects
 * @param {number} dirX direction of motion on x axis (+/-1)
 * @param {number} dirY direction of motion on y axis (+/-1)
 * @param {BoundingBox} bbox
 */
function checkCollision(entity, bbox, dirX, dirY) {
	const events = [];
	if (entity !== player) {
		const overlap = dosemuBBox.getBoundingBoxOverlap(bbox, player.getBoundingBox());
		if (overlap)
			events.push(overlap);
	}
	for (let enemy of enemies) {
		if (entity === enemy)
			continue; // don't check against self
		const enemyBbox = enemy.getBoundingBox();
		const overlap = dosemuBBox.getBoundingBoxOverlap(bbox, enemyBbox);
		if (overlap) {
			events.push(overlap);
		}
	}
	let rowMin = clamp(Math.floor(bbox.up / BRICK_SIZE), 0, MAP_ROWS-1);
	let rowMax = clamp(Math.floor(bbox.down / BRICK_SIZE), 0, MAP_ROWS-1)
	let colMin = clamp(Math.floor(bbox.left / BRICK_SIZE), 0, MAP_COLS-1);
	let colMax = clamp(Math.floor(bbox.right / BRICK_SIZE), 0, MAP_COLS-1);
	for (let i=rowMin; i<= rowMax; i++) {
		for (let j=colMin; j<= colMax; j++) {
			if (!brickMatrix[i][j])
				continue;
			const overlap = dosemuBBox.getBoundingBoxOverlap(bbox, brickMatrix[i][j].getBoundingBox());
			if (overlap) {
				events.push(overlap);
			}
		}
	}
	if (events.length)
		console.log(events);
}

class Tank {
	/** @type {{[orientation: string]: Sprite}} */
	sprites = {};
	x = 0;
	y = 0;
	/** @type {"up", "down", "left", "right"} */
	orientation = "up";
	timeSinceLastFire = 100;
	fireInterval = 0.6;
	/** @type {"player" | "enemy"} */
	identity = "";
	bulletSpeed = 150;

	constructor(sprites, x, y, orientation, identity) {
		this.sprites = sprites;
		this.x = x;
		this.y = y;
		this.orientation = orientation;
		this.identity = identity;
	}

	draw() {
		dosemu.sprite(this.x, this.y, this.sprites[this.orientation]);
	}

	update(dt) {
		this.timeSinceLastFire += dt;
	}

	fire() {
		if (this.timeSinceLastFire >= this.fireInterval) {
			// create bullet
			const [bx, by] = this.getBulletFiringPosition();
			bullets.push(new Bullet(bx, by, this.identity, this.orientation, this.bulletSpeed));
			this.timeSinceLastFire = 0;

			dosemuSound.sound(shootSounds[this.identity]);
		}
	}

	reload() {
		this.timeSinceLastFire = this.fireInterval;
	}

	getBulletFiringPosition() {
		const offs = 12 + bulletSprite.height / 2;
		switch (this.orientation) {
			case "up": return [this.x, this.y - offs];
			case "down": return [this.x, this.y + offs];
			case "left": return [this.x - offs, this.y];
			case "right": return [this.x + offs, this.y];
		}
	}

	/** returns the bounding box in world space */
	getBoundingBox() {
		return dosemuBBox.moveBoundingBox(this.sprites[this.orientation].bbox, this.x, this.y);
	}

	move(dx, dy) {
		const collisionResult = checkCollision(this, this.getBoundingBox(), Math.sign(dx), Math.sign(dy));
		this.x += dx;
		this.y += dy;
	}
}

class Bullet {
	x = 0;
	y = 0;
	speed = 10;
	orientation = "";
	identity = "";
	isDead = false;

	constructor(x, y, identity, orientation, speed) {
		this.x = x;
		this.y = y;
		this.identity = identity;
		this.orientation = orientation;
		this.speed = speed;
	}

	update(dt) {
		switch (this.orientation) {
			case "up": this.y -= this.speed * dt; break;
			case "down": this.y += this.speed * dt; break;
			case "left": this.x -= this.speed * dt; break;
			case "right": this.x += this.speed * dt; break;
		}
		if (this.x < -10 || this.y < -10 || this.x > 330 || this.y > 210) {
			// we're outside the playfield
			this.isDead = true;
		}
	}

	draw() {
		const sprite = bulletSprites[this.orientation];
		dosemu.sprite(this.x, this.y, sprite);
	}
}

class Brick {
	type = 1;
	x = 100;
	y = 100;

	constructor(type, x, y) {
		this.type = type;
		this.x = x;
		this.y = y;
	}

	draw() {
		dosemu.sprite(this.x, this.y, brickSprites[this.type - 1]);
	}

	getBoundingBox() {
		return dosemuBBox.moveBoundingBox(brickSprites[this.type - 1].bbox, this.x, this.y);
	}
}
