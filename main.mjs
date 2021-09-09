import * as dosemu from "./lib/dosemu.mjs";
import { update as soundUpdate } from "./lib/dosemu-sound.mjs";
import * as helloWorldScenario from "./scenarios/hello-world.mjs";
import * as tanksScenario from "./scenarios/tanks.mjs";
import * as mouseDrawScenario from "./scenarios/mouse-draw.mjs";

let crtScenario;
let lastTime = new Date();

export function main() {
	dosemu.init(document.querySelector("#emuscreen"), document.querySelector("#emuconsole"));

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
