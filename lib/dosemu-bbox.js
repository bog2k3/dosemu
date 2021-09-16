export class BoundingBox {
	/** @type {number} the top of the box relative to the origin, in pixels */
	up;
	/** @type {number} the bottom of the box relative to the origin, in pixels */
	down;
	/** @type {number} the left extent of the box relative to the origin, in pixels */
	left;
	/** @type {number} the right extent of the box relative to the origin, in pixels */
	right;
}

export function moveBoundingBox(bbox, x, y) {
	return {
		up: bbox.up + y,
		down: bbox.down + y,
		left: bbox.left + x,
		right: bbox.right + x
	};
}

/**
 * @param {BoundingBox} bbox
 * @returns {BoundingBox} a new bounding box rotated by 90 degrees clockwise
 */
 export function rotateBBox(bbox) {
	return {
		up: bbox.left,
		down: bbox.right,
		left: -bbox.down,
		right: -bbox.up
	};
}

export class OverlapDescriptor {
	/** @type {number} the position of the second bounding box' top-left corner relative to the first one's top-left corner */
	xRelative;
	/** @type {number} the position of the second bounding box' top-left corner relative to the first one's top-left corner */
	yRelative;
	/**
	 * @type {number} how much overlap on the x-axis:
	 * A positive value means the first box is overlapped by the 2nd in the right side by that amount
	 * A negative value means the first box is overlapped by the 2nd in the left side by that amount negated.
	 */
	xOverlap;
	/**
	 * @type {number} how much overlap on the x-axis:
	 * A positive value means the first box is overlapped by the 2nd in the bottom side by that amount
	 * A negative value means the first box is overlapped by the 2nd in the top side by that amount negated.
	 */
	yOverlap;
}

/**
 * Computes overlap between two bounding boxes.
 * If they don't overlap, returns null
 * @param {BoundingBox} bbox1
 * @param {BoundingBox} bbox2
 * @returns {OverlapDescriptor} null if the boxes don't overlap, otherwise an overlap descriptor
 */
 export function getBoundingBoxOverlap(bbox1, bbox2) {
	if (bbox1.down < bbox2.up || bbox2.down < bbox1.up)
		return null;
	if (bbox1.right < bbox2.left || bbox2.right < bbox1.left)
		return null;
	const rightOverlap = Math.min(bbox1.right - bbox1.left, bbox1.right - bbox2.left);
	const leftOverlap = Math.min(bbox1.right - bbox1.left, bbox2.right - bbox1.left);
	const downOverlap = Math.min(bbox1.down - bbox1.up, bbox1.down - bbox2.up);
	const upOverlap = Math.min(bbox1.down - bbox1.up, bbox2.down - bbox1.up);
	return {
		xRelative: bbox2.left - bbox1.left,
		yRelative: bbox2.up - bbox1.up,
		xOverlap: rightOverlap > leftOverlap ? -leftOverlap : rightOverlap,
		yOverlap: downOverlap > upOverlap ? -upOverlap : downOverlap
	};
}
