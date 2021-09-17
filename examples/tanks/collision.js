import * as dosemuBBox from "../../src/dosemu-bbox.js";
import { world } from "./world.js";

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
export function checkCollision(entity, bbox, dX, dY) {
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
		if (entity !== world.player) {
			checkOverlap(world.player);
		}
		for (let enemy of world.enemies) {
			if (entity === enemy)
				continue; // don't check against self
			checkOverlap(enemy);
		}
	}
	if (entity.isCollisionEnabled("Brick")) {
		let rowMin = clamp(Math.floor(bbox.up / world.BRICK_SIZE), 0, world.MAP_ROWS - 1);
		let rowMax = clamp(Math.floor(bbox.down / world.BRICK_SIZE), 0, world.MAP_ROWS - 1)
		let colMin = clamp(Math.floor(bbox.left / world.BRICK_SIZE), 0, world.MAP_COLS - 1);
		let colMax = clamp(Math.floor(bbox.right / world.BRICK_SIZE), 0, world.MAP_COLS - 1);
		for (let i = rowMin; i <= rowMax; i++) {
			for (let j = colMin; j <= colMax; j++) {
				if (!world.brickMatrix[i][j])
					continue;
				checkOverlap(world.brickMatrix[i][j]);
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
