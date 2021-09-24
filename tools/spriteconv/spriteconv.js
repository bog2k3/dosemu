#!/usr/bin/env node

import PNG from "png-js";
import VGA_Palette from "../../data/vga-palette.js";
import fs from "fs";

const img = PNG.load(process.argv[2]);
const w = img.width;
const h = img.height;
img.decode((imagePixels) => {
	const lines = [];
	for (let i=0; i<h; i++) {
		const pixels = [];
		for (let j=0; j<w; j++) {
			const offs = (i*w + j) * 4;
			pixels.push(bestMatch(imagePixels[offs+0], imagePixels[offs+1], imagePixels[offs+2], VGA_Palette));
		}
		lines.push(pixels);
	}
	fs.writeFileSync(`${process.argv[2]}.js`, `export default ${JSON.stringify({
		width: w,
		height: h,
		originX: Number.parseInt(process.argv[3] || Math.floor(w/2)),
		originY: Number.parseInt(process.argv[4] || Math.floor(h/2)),
		transparent: lines[h - 1][0],
		pixels: lines
	})}`);
});

function bestMatch(r, g, b, palette) {
	const diff = (i) => {
		return Math.abs(r - palette[i].rgb.r)
			+ Math.abs(g - palette[i].rgb.g)
			+ Math.abs(b - palette[i].rgb.b);
	}
	let bestI = 0;
	let bestDiff = diff(bestI);
	for (let i=1; i<256; i++) {
		const diffi = diff(i);
		if (diffi < bestDiff) {
			bestDiff = diffi;
			bestI = i;
		}
	}
	return bestI;
}
