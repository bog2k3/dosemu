import * as dosemu from "./lib/dosemu.js";
import { update as soundUpdate } from "./lib/dosemu-sound.js";
import * as helloWorldScenario from "./scenarios/hello-world.js";
import * as tanksScenario from "./scenarios/tanks/tanks.js";
import * as mouseDrawScenario from "./scenarios/mouse-draw.js";
import * as paletteScenario from "./scenarios/palette.js";

let crtScenario;
let lastTime = new Date();

export function main() {
	dosemu.init(document.querySelector("#emuscreen"), document.querySelector("#emuconsole"));

	// crtScenario = paletteScenario;
	// crtScenario = helloWorldScenario;
	crtScenario = tanksScenario;
	// crtScenario = mouseDrawScenario;

	init();
};

function init() {
	crtScenario.init();
	requestAnimationFrame(step);
}

function step() {
	draw();
	const now = new Date();
	const dt = Math.min(100, now.getTime() - lastTime.getTime()) / 1000;
	lastTime = now;
	update(dt);
	// schedule next frame
	requestAnimationFrame(step);
}

function draw() {
	// draw background noise:
	dosemu.drawNoise(4);
	// and stuff:
	crtScenario.draw();
}

function update(dt) {
	crtScenario.update(dt);
	soundUpdate(dt);
}
