import * as dosemu from "../lib/dosemu.mjs";
import * as dosemuSound from "../lib/dosemu-sound.mjs";
import marioSprite from "./data/mario-sprite.png.mjs";
import marioMusic from "./data/mario-theme.mid.mjs";

const marioGroundY = 70;
const marioShootSpeed = -80;
let marioY = marioGroundY;
let marioSpeed = 0;
const jumpSound = [];

export function init() {
	// build jump sound notes:
	for (let i=0; i<20; i++)
		jumpSound.push([100 + i*20, 0.01]);

	dosemuSound.setSoundStartedCallback(() => {
		dosemuSound.loop(marioMusic);
	});
}

export function draw() {
	dosemu.drawText(160, 100, "Hello World!", 10, "center");
	dosemu.drawText(160, 115, "Click here and press space!", 10, "center");
	dosemu.drawRectangle(30, 50, 100, 150, 12);
	dosemu.drawLine(290, 50, 130, 180, 15);
	dosemu.drawCircle(160, 100, 80, 14);
	dosemu.drawSprite(160, marioY, marioSprite);
}

export function update(dt) {
	if (marioY >= marioGroundY && marioSpeed >= 0) {
		if (marioSpeed > 0) {
			marioSpeed = 0;
			marioY = marioGroundY;
		} else if (dosemu.isKeyPressed(" ")) {
			jump();
		}
	} else {
		const g = 200; // 20 pixels is approx 1m since mario is 32px ~= 1.6m, so 200px/s^2 is approx 10m/s^2
		marioY += marioSpeed * dt + g*dt*dt/2;
		marioSpeed += g * dt;
	}
}


function jump() {
	marioSpeed = marioShootSpeed;
	dosemuSound.sound(jumpSound);
}
