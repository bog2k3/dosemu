import * as dosemu from "../../src/dosemu.js";
import { update as soundUpdate } from "../../src/dosemu-sound.js";
import * as marioScenario from "./mario-scenario.js";

let lastTime = new Date();

const scenario = marioScenario;

export function main() {
	dosemu.init(document.querySelector("#emuscreen"), document.querySelector("#emuconsole"));
	init();
};

function init() {
	dosemu.setNoiseStrength(0.25);
	scenario.init();
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
	dosemu.clearScreen();
	scenario.draw();
}

function update(dt) {
	scenario.update(dt);
	soundUpdate(dt);
}
