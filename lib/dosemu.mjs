import { init as soundInit, unmute as soundUnmute } from "./dosemu-sound.mjs";
import VGA_Palette from "./data/vga-palette.mjs";
import VGA_Font from "./data/font.mjs";
import mouseCursorSprite from "./data/mouse-cursor-large.mjs";

const CONST = {
	SCREEN_WIDTH: 320,
	SCREEN_HEIGHT: 200
};

const data = {
	/** @type {CanvasRenderingContext2D} */
	canvasCtx: null,
	/** @type {HTMLElement} */
	consoleElem: null,
	resizeTimeout: null,
	/** @type {ImageData} */
	frontBuffer: null,
	/** @type {ImageData} */
	backBuffer: null,
	/** @type {{r: number, g: number, b: number}[]} holds color rgb info for each index */
	palette: [],
	mouseVisible: true,
	cursorX: 160,
	cursorY: 100,
	/** @type {{[key: string]: boolean}} pressed status for keys */
	keysStatus: {},
	mouseButtons: [false, false, false],
	mouseDownCallback: null,
	mouseUpCallback: null,
	mouseMoveCallback: null
};

export function init(screenElement, consoleElement) {
	soundInit();
	screenElement.style.position = "relative";
	screenElement.style.maxWidth = "calc(95vh * 1.6)";
	createCanvas(screenElement);
	createUnmuteButton(screenElement);
	createConsole(consoleElement);
	createColorPalette();

	data.frontBuffer = data.canvasCtx.createImageData(CONST.SCREEN_WIDTH, CONST.SCREEN_HEIGHT);
	data.backBuffer = data.canvasCtx.createImageData(CONST.SCREEN_WIDTH, CONST.SCREEN_HEIGHT);

	requestAnimationFrame(updateScreen);
}

export function consoleOut(text) {
	const p = document.createElement("p");
	p.innerText = text;
	p.style.margin = "0 1em 0.1em 1em";
	data.consoleElem.appendChild(p);
	p.scrollIntoView();
}

export function showMouse() {
	data.mouseVisible = true;
}

export function hideMouse() {
	data.mouseVisible = false;
}

/**
 * @param {number} button 0 to 3
 */
 export function isMouseButtonDown(button) {
	return data.mouseButtons[button];
}

/**
 * @param {(x: number, y: number, bnt: number) => void} callback
 */
export function onMouseDown(callback) {
	data.mouseDownCallback = callback;
}

/**
 * @param {(x: number, y: number, bnt: number) => void} callback
 */
export function onMouseUp(callback) {
	data.mouseUpCallback = callback;
}

/**
 * @param {(x: number, y: number, dx: number, dy: number) => void} callback
 */
export function onMouseMove(callback) {
	data.mouseMoveCallback = callback;
}

/**
 * @param {string} key the name of the key
 * @returns true if the queried key is pressed down at this time
 */
export function isKeyPressed(key) {
	return data.keysStatus[key];
}

export function putPixel(x, y, colorIndex) {
	if (x < 0 || x >= CONST.SCREEN_WIDTH || y < 0 || y >= CONST.SCREEN_HEIGHT) {
		return;
	}
	if (colorIndex < 0 || colorIndex > 255) {
		colorIndex = 201;
	}
	x = Math.floor(x);
	y = Math.floor(y);
	const noiseStrength = 20;
	const noiseOffs = -noiseStrength / 2;
	const noise = buildPixelRGBNoise(noiseStrength);
	const r = data.palette[colorIndex].r + noiseOffs + noise.r;
	const g = data.palette[colorIndex].g + noiseOffs + noise.g;
	const b = data.palette[colorIndex].b + noiseOffs + noise.b;
	const offset = 4 * (y * CONST.SCREEN_WIDTH + x);
	data.frontBuffer.data[offset + 0] = r;
	data.frontBuffer.data[offset + 1] = g;
	data.frontBuffer.data[offset + 2] = b;
	data.frontBuffer.data[offset + 3] = 255;
}

/**
 *
 * @param x {number}
 * @param y {number}
 * @param str {string}
 * @param color {number} the color index
 * @param alignment {"left", "center", "right"}
 */
export function text(x, y, str, color, alignment = "left") {
	switch (alignment) {
		case "left":
			break;
		case "right":
			x -= str.length * VGA_Font.charWidth;
			break;
		case "center":
			x -= (str.length + 1) * VGA_Font.charWidth / 2;
			y -= VGA_Font.charHeight / 2;
			break;
	}
	for (let char of str) {
		for (let i = 0; i < VGA_Font.charHeight; i++)
			for (let j = 0; j < VGA_Font.charWidth; j++) {
				if (VGA_Font.charData[char.charCodeAt(0)][i][j])
					putPixel(x + j, y + i, color);
			}
		x += VGA_Font.charWidth;
	}
}

export function bar(x1, y1, x2, y2, color) {
	for (let y = y1; y <= y2; y++) {
		for (let x = x1; x <= x2; x++) {
			putPixel(x, y, color);
		}
	}
}

export function rectangle(x1, y1, x2, y2, color) {
	bar(x1, y1, x2, y1, color);
	bar(x1, y1, x1, y2, color);
	bar(x2, y1, x2, y2, color);
	bar(x1, y2, x2, y2, color);
}

export function line(x1, y1, x2, y2, color) {
	if (x1 == x2) {
		if (y2 >= y1)
			for (let i = y1; i <= y2; i++)
				putPixel(x1, i, color);
		else
			for (let i = y2; i <= y1; i++)
				putPixel(x1, i, color);
		return;
	}
	if (y1 == y2) {
		if (x1 <= x2)
			for (let i = x1; i <= x2; i++)
				putPixel(i, y1, color);
		else
			for (let i = x2; i <= x1; i++)
				putPixel(i, y1, color);
		return;
	}

	const Slope = (y1 - y2) / (x1 - x2);
	const DifX = Math.abs(x1 - x2);
	const DifY = Math.abs(y1 - y2);
	if (DifX <= DifY) {
		if (y1 > y2) {
			x1 = x2;
			y1 = y2;
		}
		const RSlope = 1.0 / Slope;
		for (let i = 0; i <= DifY; i++)
			putPixel(i * RSlope + x1, i + y1, color);
	} else {
		if (x1 > x2) {
			x1 = x2;
			y1 = y2;
		}
		for (let i = 0; i <= DifX; i++)
			putPixel(i + x1, Slope * i + y1, color);
	}
}

export function circle(x, y, r, color) {
	let d = 3 - (r + r);
	let i = 0;
	let j = r;
	while (i <= j) {
		putPixel(x + i, y + j, color);
		putPixel(x + i, y - j, color);
		putPixel(x - i, y + j, color);
		putPixel(x - i, y - j, color);
		putPixel(x + j, y + i, color);
		putPixel(x + j, y - i, color);
		putPixel(x - j, y + i, color);
		putPixel(x - j, y - i, color);
		i++;
		if (d < 0)
			d += (i << 2) + 6;
		else {
			d += ((i - j) << 2) + 10;
			j--;
		}
	}
}

/**
 * Draws a sprite. The color in the lower-left corner is considered transparent
 * @param {number} x
 * @param {number} y
 * @param {{width: number, height: number, originX: number, originY: number, transparent: number, pixels: number[][]}} sprite
 */
export function sprite(x, y, sprite) {
	drawImageTargeted(x, y, sprite, putPixel);
}

/**
 * Fills the entire screen with noise
 * @param strength should be in the range [2..23]
 */
export function drawNoise(strength = 5) {
	strength = Math.min(23, Math.max(2, strength));
	for (let x=0; x<320; x++) {
		for (let y=0; y<200; y++) {
			putPixel(x, y, Math.floor(232 + Math.random() * strength));
		}
	}
}

function buildPixelRGBNoise(strength) {
	return {
		r: Math.floor(Math.random() * strength),
		g: Math.floor(Math.random() * strength),
		b: Math.floor(Math.random() * strength),
	};
}

/** @param {{width: number, height: number, originX: number, originY: number, transparent: number, pixels: number[][]}} sprite */
function drawImageTargeted(x, y, sprite, pixelFn) {
	x -= sprite.originX || 0;
	y -= sprite.originY || 0;
	for (let i = 0; i < sprite.height; i++) {
		for (let j = 0; j < sprite.width; j++) {
			const color = sprite.pixels[i][j];
			if (color != sprite.transparent) {
				pixelFn(j + x, i + y, color);
			}
		}
	}
}

function createCanvas(parentElement) {
	const canvas = document.createElement("canvas");
	canvas.width = CONST.SCREEN_WIDTH;
	canvas.height = CONST.SCREEN_HEIGHT;
	canvas.tabIndex = 1;
	window.addEventListener("resize", () => onCanvasResized(canvas));
	const canvasStyle = {
		position: "relative",
		width: "calc(100% - 2em)",
		border: "solid 0.5em black",
		margin: "0.5em",
		cursor: "none"
	};
	for (let key in canvasStyle) {
		canvas.style[key] = canvasStyle[key];
	}
	parentElement.appendChild(canvas);
	onCanvasResized(canvas);
	data.canvasCtx = canvas.getContext("2d");

	canvas.oncontextmenu = function(e) { e.preventDefault(); e.stopPropagation(); }
	canvas.addEventListener("mousemove", (ev) => handleMouseMove(canvas, ev));
	canvas.addEventListener("mousedown", handleMouseDown);
	canvas.addEventListener("mouseup", handleMouseUp);
	canvas.onkeydown = handleKeyDown;
	canvas.onkeyup = handleKeyUp;
}

/** @param {HTMLElement} parentElem */
function createUnmuteButton(parentElem) {
	const buttonElem = document.createElement("div");
	const buttonStyle = {
		position: "absolute",
		right: "1rem",
		bottom: "1rem",
		width: "4rem",
		height: "3rem",
		borderRadius: "0.5rem",
		border: "2px solid rgba(255,255,255,0.9)",
		background: "rgba(255,255,255,0.7)",
		userSelect: "none",
		cursor: "pointer",
		textAlign: "center",
		lineHeight: "3rem",
		fontSize: "2em"
	}
	for (let key in buttonStyle) {
		buttonElem.style[key] = buttonStyle[key];
	}
	parentElem.appendChild(buttonElem);
	const icon = document.createElement("span");
	icon.innerHTML = "&#x1f507;";
	buttonElem.appendChild(icon);

	buttonElem.onclick = () => {
		soundUnmute();
		parentElem.removeChild(buttonElem);
	}
}

function createConsole(parentElement) {
	data.consoleElem = document.createElement("div");
	parentElement.appendChild(data.consoleElem);
	data.consoleElem.style.width = "100%";
	data.consoleElem.style.minHeight = "5em";
}

function onCanvasResized(canvas) {
	if (data.resizeTimeout) {
		clearTimeout(data.resizeTimeout);
		data.resizeTimeout = null;
	}
	data.resizeTimeout = setTimeout(() => {
		canvas.style.height = `${Math.floor(canvas.offsetWidth / CONST.SCREEN_WIDTH * CONST.SCREEN_HEIGHT)}px`;
	}, 200);
}

function createColorPalette() {
	for (let index in VGA_Palette) {
		data.palette[VGA_Palette[index].colorId] = {
			r: VGA_Palette[index].rgb.r,
			g: VGA_Palette[index].rgb.g,
			b: VGA_Palette[index].rgb.b,
		}
	}
}

function drawMouse() {
	const directPixelFn = (x, y, colorIndex) => {
		x = Math.floor(x);
		y = Math.floor(y);
		const noise = buildPixelRGBNoise(30);
		const r = Math.max(0, data.palette[colorIndex].r - noise.r);
		const g = Math.max(0, data.palette[colorIndex].g - noise.g);
		const b = Math.max(0, data.palette[colorIndex].b - noise.b);
		data.canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		data.canvasCtx.fillRect(x, y, 1, 1);
	}
	drawImageTargeted(data.cursorX, data.cursorY, mouseCursorSprite, directPixelFn);
}

function updateScreen() {
	data.canvasCtx.putImageData(data.frontBuffer, 0, 0);
	if (data.mouseVisible) {
		drawMouse();
	}
	requestAnimationFrame(updateScreen);
}

function handleMouseMove(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const newX = Math.floor((event.clientX - rect.left) / rect.width * CONST.SCREEN_WIDTH);
	const newY = Math.floor((event.clientY - rect.top) / rect.height * CONST.SCREEN_HEIGHT);
	const dx = newX - data.cursorX;
	const dy = newY - data.cursorY;
	data.cursorX = newX;
	data.cursorY = newY;
	if (data.mouseMoveCallback) {
		data.mouseMoveCallback(data.cursorX, data.cursorY, dx, dy);
	}
}

/** @param {MouseEvent} event */
function handleMouseDown(event) {
	data.mouseButtons[event.button] = true;
	if (data.mouseDownCallback)
		data.mouseDownCallback(data.cursorX, data.cursorY, event.button);
}

/** @param {MouseEvent} event */
function handleMouseUp(event) {
	data.mouseButtons[event.button] = false;
	if (data.mouseUpCallback)
		data.mouseUpCallback(data.cursorX, data.cursorY, event.button);
}

/** @param {KeyboardEvent} ev */
function handleKeyDown(ev) {
	data.keysStatus[ev.key] = true;
	if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(ev.key)) {
		return preventPageScroll(ev);
	}
}

/** @param {KeyboardEvent} ev */
function handleKeyUp(ev) {
	data.keysStatus[ev.key] = false;
}

/** Prevents the arrow keys and spacebar from scrolling the page while playing the game
 * @param {KeyboardEvent} */
function preventPageScroll(ev) {
	ev.preventDefault = true;
	ev.stopPropagation();
	ev.stopImmediatePropagation();
	return false;
}
