import * as dosemu from "../../src/dosemu.js";

export function init() {
}

export function draw() {
	dosemu.drawText(160, 100, "Hello World!", 10, "center");
	dosemu.drawRectangle(30, 50, 100, 150, 12);
	dosemu.drawLine(290, 50, 130, 180, 15);
	dosemu.drawCircle(160, 100, 80, 14);
}

export function update(dt) {
}
