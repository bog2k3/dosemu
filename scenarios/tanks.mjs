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

const debugFlags = {
	drawCenterPoint: false,
	drawBBox: false
};

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
	player.draw();
	for (let enemy of enemies) {
		enemy.draw();
	}
	for (let brick of bricks) {
		brick.draw();
	}
	for (let bullet of bullets) {
		bullet.draw();
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
	for (let i = 0; i < bricks.length;) {
		if (bricks[i].isDead) {
			brickMatrix[bricks[i].y / BRICK_SIZE][bricks[i].x / BRICK_SIZE] = null;
			bricks.splice(i, 1);
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
				brickMatrix[i][j] = bricks[bricks.length - 1];
			}
			if (code >= 5 && code <= 8) {
				enemies.push(new Tank(enemyTankSprites[code - 5], x + BRICK_SIZE / 2, y + BRICK_SIZE / 2, "up", "enemy"));
			}
			if (code === 9) {
				createPlayer(x + BRICK_SIZE / 2, y + BRICK_SIZE / 2);
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
	dosemuSprite.computeBoundingBox(playerTankSprite);
	playerTankSprites["up"] = playerTankSprite;
	playerTankSprites["right"] = dosemuSprite.rotateSprite(playerTankSprite, 1);
	playerTankSprites["down"] = dosemuSprite.rotateSprite(playerTankSprite, 2);
	playerTankSprites["left"] = dosemuSprite.rotateSprite(playerTankSprite, 3);

	const enemyTankSpriteList = [enemyTankSpriteA, enemyTankSpriteB, enemyTankSpriteC, enemyTankSpriteD];
	for (let enemySprite of enemyTankSpriteList) {
		const spriteSet = {}
		dosemuSprite.computeBoundingBox(enemySprite);
		spriteSet["up"] = enemySprite;
		spriteSet["right"] = dosemuSprite.rotateSprite(enemySprite, 1);
		spriteSet["down"] = dosemuSprite.rotateSprite(enemySprite, 2);
		spriteSet["left"] = dosemuSprite.rotateSprite(enemySprite, 3);
		enemyTankSprites.push(spriteSet);
	}

	dosemuSprite.computeBoundingBox(bulletSprite);
	bulletSprites["up"] = bulletSprite;
	bulletSprites["right"] = dosemuSprite.rotateSprite(bulletSprite, 1);
	bulletSprites["down"] = dosemuSprite.rotateSprite(bulletSprite, 2);
	bulletSprites["left"] = dosemuSprite.rotateSprite(bulletSprite, 3);

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

function checkOverlapWithEntity(refEntity, refBbox, otherEntity, outEvents) {
	const overlap = dosemuBBox.getBoundingBoxOverlap(refBbox, otherEntity.getBoundingBox());
	if (overlap && refEntity.filterCollision(otherEntity)) {
		outEvents.push({
			...overlap,
			entity: otherEntity
		});
	}
}

function getNearestCollision(entity, bbox, dirX, dirY) {
	const events = [];
	const checkOverlap = (other) => checkOverlapWithEntity(entity, bbox, other, events);
	if (entity.isCollisionEnabled("Tank")) {
		if (entity !== player) {
			checkOverlap(player);
		}
		for (let enemy of enemies) {
			if (entity === enemy)
				continue; // don't check against self
			checkOverlap(enemy);
		}
	}
	if (entity.isCollisionEnabled("Brick")) {
		let rowMin = clamp(Math.floor(bbox.up / BRICK_SIZE), 0, MAP_ROWS - 1);
		let rowMax = clamp(Math.floor(bbox.down / BRICK_SIZE), 0, MAP_ROWS - 1)
		let colMin = clamp(Math.floor(bbox.left / BRICK_SIZE), 0, MAP_COLS - 1);
		let colMax = clamp(Math.floor(bbox.right / BRICK_SIZE), 0, MAP_COLS - 1);
		for (let i = rowMin; i <= rowMax; i++) {
			for (let j = colMin; j <= colMax; j++) {
				if (!brickMatrix[i][j])
					continue;
				checkOverlap(brickMatrix[i][j]);
			}
		}
	}
	if (!events.length) {
		return null;
	}
	// sort events by distance - the ones that occur earlier in the movement come first
	events.sort((e1, e2) => {
		const e1_total = e1.overlapX * dirX + e1.overlapY * dirY;
		const e2_total = e2.overlapX * dirX + e2.overlapY * dirY;
		return e2_total - e1_total;
	});
	return events[0]; // events[0] is the first collision
}

/** checks a bounding box at a position against collisions with world objects
 * @param {number} dX delta X that entity wants to move
 * @param {number} dY delta Y that entity wants to move
 * @param {BoundingBox} bbox
 * @returns {{
 * 		collider: Entity | null,
 * 		travelX: number,
 * 		travelY: number
 * }} collider represents the entity that was collided with (or null if there was no collision);
 * travelX and travelY are the distances that can be travelled right up to the collision point.
 */
function checkCollision(entity, bbox, dX, dY) {
	const projectedBBox = dosemuBBox.moveBoundingBox(bbox, dX, dY);
	const dxSign = Math.sign(dX);
	const dySign = Math.sign(dY);
	const projectedCollision = getNearestCollision(entity, projectedBBox, dxSign, dySign);
	if (!projectedCollision) {
		return {
			collider: null, // no collisions detected
			travelX: dX,
			travelY: dY
		};
	}
	const overlapNormalized = clamp((Math.abs(projectedCollision.xOverlap * dX) + Math.abs(projectedCollision.yOverlap * dY)) / Math.sqrt(dX * dX + dY * dY), 0.0, 1.0);
	// compute the overlap before any motion is made:
	const staticCollision = getNearestCollision(entity, bbox, dxSign, dySign);
	let prevOverlapNormalized = 0;
	if (staticCollision) {
		prevOverlapNormalized = clamp((Math.abs(staticCollision.xOverlap * dX) + Math.abs(staticCollision.yOverlap * dY)) / Math.sqrt(dX * dX + dY * dY), 0.0, 1.0);
	}
	// if the final overlap is not greater than the initial overlap, then the motion is made on a normal or evading axis, and we allow it
	let motionFactor = 1.0 - (prevOverlapNormalized < overlapNormalized ? overlapNormalized : 0.0);
	return {
		collider: projectedCollision.entity,
		travelX: dX * motionFactor,
		travelY: dY * motionFactor
	};
}

class Entity {
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
		if (debugFlags.drawBBox) {
			dosemu.drawBBox(this.getBoundingBox(), 56);
		}
		if (debugFlags.drawCenterPoint) {
			dosemu.drawBar(this.x - 1, this.y, this.x + 1, this.y, 46);
			dosemu.drawBar(this.x, this.y - 1, this.x, this.y + 1, 46);
		}
	}
}

class Tank extends Entity {
	/** @type {{[orientation: string]: Sprite}} */
	sprites = {};
	/** @type {"up", "down", "left", "right"} */
	orientation = "up";
	timeSinceLastFire = 100;
	fireInterval = 0.6;
	/** @type {"player" | "enemy"} */
	identity = "";
	bulletSpeed = 150;

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
		this.drawDebug();
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
		this.timeSinceLastFire = Math.max(this.timeSinceLastFire, this.fireInterval / 2);
	}

	getBulletFiringPosition() {
		const offs = playerTankSprite.originY + bulletSprite.height - bulletSprite.originY - 10;
		switch (this.orientation) {
			case "up": return [this.x, this.y - offs];
			case "down": return [this.x, this.y + offs];
			case "left": return [this.x - offs, this.y];
			case "right": return [this.x + offs, this.y];
		}
	}

	/** @param {Entity} otherEntity */
	handleCollision(otherEntity) {

	}
}

class Bullet extends Entity {
	speed = 10;
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
		return dosemuBBox.moveBoundingBox(bulletSprites[this.orientation].bbox, this.x, this.y);
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
		const sprite = bulletSprites[this.orientation];
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

class Brick extends Entity {
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
		return dosemuBBox.moveBoundingBox(brickSprites[this.type - 1].bbox, this.x, this.y);
	}

	draw() {
		dosemu.drawSprite(this.x, this.y, brickSprites[this.type - 1]);
		this.drawDebug();
	}

	/** @param {Entity} otherEntity */
	handleCollision(otherEntity) {
		if (otherEntity.getType() === "Bullet") {
			this.break();
		}
	}

	/** breaks the brick into pieces */
	break() {
		// TODO play animation
		this.isDead = true;
	}
}
