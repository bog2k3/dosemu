import * as dosemu from "../../src/dosemu.js";
import * as dosemuSprite from "../../src/dosemu-sprite.js";
import * as dosemuSound from "../../src/dosemu-sound.js";
import playerTankSprite from "./data/tank-sprite-player.png.js";
import enemyTankSpriteA from "./data/tank-sprite-enemy-a.png.js";
import enemyTankSpriteB from "./data/tank-sprite-enemy-b.png.js";
import enemyTankSpriteC from "./data/tank-sprite-enemy-c.png.js";
import enemyTankSpriteD from "./data/tank-sprite-enemy-d.png.js";
import bulletSprite from "./data/bullet-sprite.png.js";
import brickSprite1 from "./data/brick-sprite1.png.js";
import brickSprite2 from "./data/brick-sprite2.png.js";
import music from "./data/music.mid.js";
import { Entity } from "./entity.js";
import { Brick } from "./brick-entity.js";
import { Tank } from "./tank-entity.js";
import { Bullet } from "./bullet-entity.js";
import { world } from "./world.js";
import { AIController } from "./ai-controller.js";
import { HumanController } from "./human-controller.js";

Entity.debugFlags.drawCenterPoint = false;
Entity.debugFlags.drawBBox = false;

/** @type {{[orientation: string]: Sprite}} */
const playerTankSprites = {};
/** @type {Sprite[]} */
const enemyTankSprites = [];

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
	[1, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 1],
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
	dosemuSound.setSoundStartedCallback(() => {
		dosemuSound.loop(music, -1, null, "triangle");
	});
}

export function draw() {
	world.player.draw();
	for (let enemy of world.enemies) {
		enemy.draw();
	}
	for (let brick of world.bricks) {
		brick.draw();
	}
	for (let bullet of world.bullets) {
		bullet.draw();
	}

	world.drawOnTopExec();
}

export function update(dt) {
	for (let i=0; i<world.enemies.length; ) {
		let enemy = world.enemies[i];
		enemy.update(dt);
		if (enemy.health <= 0) {
			world.enemies.splice(i, 1)
			dosemu.consoleOut("Enemy destroyed!");
		} else {
			i++;
		}
	}
	world.player.update(dt);
	for (let i = 0; i < world.bullets.length;) {
		world.bullets[i].update(dt);
		if (world.bullets[i].isDead) {
			world.bullets.splice(i, 1);
		} else {
			i++;
		}
	}
	for (let i = 0; i < world.bricks.length;) {
		if (world.bricks[i].isDead) {
			world.brickMatrix[world.bricks[i].y / world.BRICK_SIZE][world.bricks[i].x / world.BRICK_SIZE] = null;
			world.bricks.splice(i, 1);
		} else {
			i++;
		}
	}
}

function placeEntities() {
	for (let i = 0; i < world.MAP_ROWS; i++) {
		world.brickMatrix[i] = [];
		for (let j = 0; j < world.MAP_COLS; j++) {
			const x = j * world.BRICK_SIZE;
			const y = i * world.BRICK_SIZE;
			const code = map[i][j];
			if (code >= 1 && code <= 4) {
				world.bricks.push(new Brick(code, x, y));
				world.brickMatrix[i][j] = world.bricks[world.bricks.length - 1];
			}
			if (code >= 5 && code <= 8) {
				createEnemy(x + world.BRICK_SIZE / 2, y + world.BRICK_SIZE / 2, code - 5);
			}
			if (code === 9) {
				createPlayer(x + world.BRICK_SIZE / 2, y + world.BRICK_SIZE / 2);
			}
		}
	}
}

function createPlayer(x, y) {
	world.player = new Tank(playerTankSprites, x, y, "up", "player");
	world.player.addController(new HumanController(world.player, world));
}

function createEnemy(x, y, type) {
	const enemy = new Tank(enemyTankSprites[type], x, y, "up", "enemy")
	enemy.addController(new AIController(enemy, world));
	world.enemies.push(enemy);
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
	Bullet.sprites["up"] = bulletSprite;
	Bullet.sprites["right"] = dosemuSprite.rotateSprite(bulletSprite, 1);
	Bullet.sprites["down"] = dosemuSprite.rotateSprite(bulletSprite, 2);
	Bullet.sprites["left"] = dosemuSprite.rotateSprite(bulletSprite, 3);

	const brickSpriteList = [brickSprite1, brickSprite2];
	for (let brickSprite of brickSpriteList) {
		dosemuSprite.computeBoundingBox(brickSprite);
		Brick.sprites.push(brickSprite);
	}
}

function buildSounds() {
	world.sounds.tankShoot.player = [[0, 0.01], [50, 0.05], [10, 0.05], [50, 0.05], [10, 0.05]];
	world.sounds.tankShoot.enemy = [[0, 0.01], [50, 0.05], [500, 0.01], [50, 0.05], [500, 0.01]];
}
