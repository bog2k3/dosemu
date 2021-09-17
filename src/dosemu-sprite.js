import * as bbox from "./dosemu-bbox.js";
import { BoundingBox } from "./dosemu-bbox.js";

export class Sprite {
	/** @type {number} the width of the sprite, in pixels */
	width;
	/** @type {number} the height of the sprite, in pixels */
	height;
	/** @type {number} the offset of the sprite's origin from the left edge, in pixels */
	originX;
	/** @type {number} the offset of the sprite's origin from the top edge, in pixels */
	originY;
	/** @type {number} the color index that will be considered transparent */
	transparent;
	/** @type {number[][]} the pixel matrix, each pixel holds the color index */
	pixels;
	/** @type {number} specifies a custom top value for the bounding box - this is used when computeBoundingBox() is called */
	bboxTop;
	/** @type {number} specifies a custom bottom value for the bounding box - this is used when computeBoundingBox() is called */
	bboxBottom;
	/** @type {number} specifies a custom left value for the bounding box - this is used when computeBoundingBox() is called */
	bboxLeft;
	/** @type {number} specifies a custom right value for the bounding box - this is used when computeBoundingBox() is called */
	bboxRight;
	/** @type {BoundingBox} the sprite's bounding box. In order to compute this, you must call computeBoundingBox() on the sprite. */
	bbox;
}

/**
 * Rotates a sprite clockwise in increments of 90 degrees around its origin
 * @param {Sprite} sprite the source sprite
 * @param {number} times how many times to rotate it (for example to turn it by 270 degrees, specify 3)
 * @returns {Sprite} a new sprite, rotated
 */
export function rotateSprite(sprite, times) {
	times = times % 4;
	const rotatedSprite = {
		width: sprite.height,
		height: sprite.width,
		originX: sprite.height - (sprite.originY || 0),
		originY: sprite.originX,
		transparent: sprite.transparent,
		pixels: []
	};
	for (let i=0; i<sprite.width; i++) {
		rotatedSprite.pixels.push([]);
		for (let j=0; j<sprite.height; j++) {
			rotatedSprite.pixels[i][j] = sprite.pixels[sprite.height-1-j][i];
		}
	}
	if (sprite.bbox) {
		rotatedSprite.bbox = bbox.rotateBBox(sprite.bbox);
	}
	if (times == 1) {
		return rotatedSprite;
	} else {
		return rotateSprite(rotatedSprite, times-1);
	}
}

/**
 * Computes a bounding box around the sprite, expressed relatively to the sprite's origin, ignoring transparent pixels
 * Saves the bounding box in the sprite's "bbox" field which contains {up: number, left: number, right: number, down: number}
 * @param {Sprite} sprite
 */
export function computeBoundingBox(sprite) {
	let minX = sprite.width;
	let minY = sprite.height;
	let maxX = 0;
	let maxY = 0;
	for (let i=0; i<sprite.height; i++) {
		for (let j=0; j<sprite.width; j++) {
			if (sprite.pixels[i][j] == sprite.transparent)
				continue;
			if (j < minX)
				minX = j;
			if (j > maxX)
				maxX = j;
			if (i < minY)
				minY = i;
			if (i > maxY)
				maxY = i;
		}
	}
	sprite.bbox = {
		left: (sprite.bboxLeft || minX) - sprite.originX,
		right: (sprite.bboxRight || maxX) - sprite.originX,
		up: (sprite.bboxTop || minY) - sprite.originY,
		down: (sprite.bboxBottom || maxY) - sprite.originY
	};
}
