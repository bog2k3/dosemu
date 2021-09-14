import * as dosemu from "../lib/dosemu.mjs";

let rowOffs = 0;

export function init() {
	dosemu.onKeyDown(handleKeyDown);
}

export function draw() {
	dosemu.drawNoise();
	const sqW = 30;
	const textH = 10;
	const rowH = sqW + textH;
	const perRow = Math.floor(320 / sqW);

	for (let i=0; i<256; i++) {
		const crtRow = Math.floor(i / perRow) - rowOffs;
		const crtCol = i % perRow;
		dosemu.drawBar(crtCol*sqW, crtRow*rowH, (crtCol+1)*sqW-1, crtRow*rowH+sqW-1, i);
		dosemu.drawText(crtCol*sqW, crtRow*rowH+sqW, String(i), i);
	}
}

export function update(dt) {

}

function handleKeyDown(key) {
	if (key === "ArrowDown")
		rowOffs++;
	if (key === "ArrowUp")
		rowOffs--;
}
