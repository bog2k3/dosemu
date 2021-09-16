import * as dosemu from "../lib/dosemu.js";

let crtColor = 1;
let pixels = [];

export function init() {
	dosemu.onMouseDown(handleMouseDown);
	dosemu.onMouseMove(handleMouseMove);
}

export function draw() {
	for (let i=0; i<200; i++) {
		if (!pixels[i])
			continue;
		for (let j=0; j<320; j++) {
			if (pixels[i][j]) {
				dosemu.drawPixel(j, i, pixels[i][j]);
			}
		}
	}
}

export function update(dt) {
}

function handleMouseDown(x, y, btn) {
	if (btn === 0) {
		setPixel(x, y, crtColor);
	} else if (btn === 2) {
		crtColor = (crtColor + 1) % 256;
	}
}

function handleMouseMove(x, y, dx, dy) {
	if (dosemu.isMouseButtonDown(0)) {
		setPixel(x, y, crtColor);
	}
}

function setPixel(x, y, color) {
	if (!pixels[y])
		pixels[y] = [];
	pixels[y][x] = color;
}
