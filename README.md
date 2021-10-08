# DOSEMU - a library for emulating DOS VGA graphics look and feel into an HTML5 Canvas

If you feel nostalgic about the look and feel of old DOS games, this library helps you recreate that into the browser.

![Tanks screenshot](https://github.com/bog2k3/dosemu/blob/master/screenshots/screenshot-tanks.png)

## Table of Contents

* [Usage notes](#usage-notes)
* [Examples](#examples)
* [Getting started](#getting-started)
* [Graphics](#graphics)
* * [Draw Functions](#draw-functions)
* * [Color Palette](#color-palette)
* * [Sprites](#sprites)
* [Keyboard Input](#keyboard-input)
* [Mouse Input](#mouse-input)
* [Sound and Music](#sound-and-music)
* [Tools](#tools)
* * [Sprite Converter](#spriteconv)
* * [MIDI Converter](#midiconv)

## Usage notes <a name="usage-notes"></a>

The library is packed as a set of ES6 Modules, thus you'll need to specify `type="module"` in your HTML:

```
<html>
	<script type="module" src="my-main-script.js"></script>
</html>
```

Then use ES6-style imports in your `my-main-script.js` file

```import { dosemu } from "./node_modules/dosemu/index.js";```


## Check out the examples <a name="examples"></a>

Since ES6 imports require an HTTP server, to run the examples start up an HTTP server in the root of the dosemu package (npm http-server will do), then navigate to
```http://localhost:8080/examples/name-of-example```

## Getting started <a name="getting-started"></a>

> See the [Minimal working example](#minimal-example) below.

The examples should provide a straight-forward way of how to use the library, but here's a quick guide nonetheless:
1. Import dosemu

        import { dosemu } from './node_modules/dosemu/index.js';

2. Initialize dosemu by giving it a reference to your "screen" element
(where the canvas will be created by dosemu) and a reference to a "console" element
(where dosemu will create a console to display output from your code).
You do not need to create the canvas by yourself, in fact you shouldn't.

        dosemu.init(document.querySelector("#emuscreen"), document.querySelector("#emuconsole"));

3. Set up the game-loop in your preferred way
4. Write your frame render function, by using the various **draw\*** functions from dosemu

        dosemu.clearScreen();
        dosemu.drawPixel(100, 150, 15); // draw a pixel at location (100, 150) in color 15
        dosemu.drawLine(10, 10, 20, 20, 3); // draw a line from (10, 10) to (20, 20) in color 3
        // and so on - all draw functions are covered below.

## Minimal Working Example <a name="minimal-example"></a>

```
<html>
  <head>
    <title>DOSEMU Test</title>
  </head>
  <body>
    <div id="root">
      <div id="emuscreen"></div>
      <div id="emuconsole"></div>
    </div>
  </body>
  <script type="module">
    import { dosemu } from "./node_modules/dosemu/index.js";

    document.onreadystatechange = () => {
      dosemu.init(document.querySelector("#emuscreen"), document.querySelector("#emuconsole"));
      init();
    };

    function init() {
      requestAnimationFrame(draw);
    }

    function draw() {
      dosemu.clearScreen();
      dosemu.drawText(160, 100, "Hello World", 10, "center");

	  requestAnimationFrame(draw);
    }
  </script>
</html>

```

## Graphics <a name="graphics"></a>

The dosemu screen has a fixed resolution of **320 x 200** pixels just like the old "mode 13" in DOS.<br>
The colors are 8 bits per pixel, indexed, giving a palette of **256** possible colors.<br>
Each draw function accepts a number between 0..255 as the color index.<br>
The drawing is double-buffered, meaning the draw functions operate on a back-buffer, not directly onto the screen, and this buffer is perioadically copied over to the screen; this achieves flicker-free drawing.<br>
The coordinates of the virtual screen are **(0, 0)** for the upper left corner, growing to the right and down up to **(319, 199)** for the bottom-right corner.

### Draw functions <a name="draw-functions"></a>

*		clearScreen()
	Clears the entire frame buffer

*		drawPixel(x, y, color)
	Draws a single pixel at position (**x**,**y**) in the given color (**0**..**255**)

*		drawText(x, y, text, color, aligment="left")
	Draws a text anchored at a given position, in a specified color.<br>
	The alignment can be one of **"left"** | **"right"** | **"center"**. The position of the text relative to the anchor point is determined by the alignment.<br>
	Text is rendered using a monospaced bitmap VGA font that is **8** pixels wide and **10** pixels high for each character.

*		drawBar(xLeft, yTop, xRight, yBottom, color)
	Draws a "bar" (which is a filled rectangle) from the (**xLeft**, **yTop**) coordinates down and right to (**xRight**, **yBottom**) inclusive.<br>
	**xRight** is assumed to be greater-than-or-equal to **xLeft**.<br>
	**yBottom** is assumed to be greater-than-or-equal to **yTop**.

*		drawRectangle(xLeft, yTop, xRight, yBottom, color)
	Draws a rectangle from the (**xLeft**, **yTop**) coordinates down and right to (**xRight**, **yBottom**) inclusive.<br>
	**xRight** is assumed to be greater-than-or-equal to **xLeft**.<br>
	**yBottom** is assumed to be greater-than-or-equal to **yTop**.

*		drawLine(x1, y1, x2, y2, color)
	Draws a straight line from (**x1**, **y1**) to (**x2**, **y2**) inclusive.<br>
	The coordinates can be given in any order in this case.

*		drawCircle(x, y, radius, color)
	Draws a circle centered at (**x**, **y**) with a radius of **r**, in the specified color.

*		drawSprite(x, y, sprite, ghost=false)
	Draws a sprite at position (**x**, **y**). See [Sprites](#sprites) below
	If **ghost** is set to true, only the odd pixels of the sprite will be drawn, giving a ghost-like, see-through effect.

*		drawBBox(bbox, color)
	Draws a bounding-box (**bbox**) expressed in screen-space, using the given **color**. See [Bounding Boxes](#BBox) below.<br>
	This can be used for debug purposes, since a bounding box is basically a rectangle, so there's no other use case for this function.

### Color palette <a name="color-palette"></a>

The color palette can be visualized by running the "palette" example. Each color is numbered for easy reference.<br>
This is the standard VGA 256 color palette used in old DOS applications and games.

### Sprites <a name="sprites"></a>

A sprite is an object containing a pixel matrix and some metadata - see the class definition below.<br>
A sprite can be either written manually (not recommended) or obtained from a PNG image by using the `spriteconv` tool included - see [Tools](#tools).<br>
The **bbox** field can be computed automatically using the `computeBBox()` function in **dosemu-sprites** - this will compute a tight bounding box around the visible pixels of the sprite, ignoring any transparent pixels.<br>
Of course the bounding box can be specified manually using the **bboxTop**, **bboxBottom**, **bboxLeft** and **bboxRight** members prior to invoking the computation - these values (if present) override the automatic detection.

```
// this is defined in dosemu-sprite.js
class Sprite {
	/** @type {number} the width of the sprite, in pixels */
	width;
	/** @type {number} the height of the sprite, in pixels */
	height;
	/** @type {number} the offset of the sprite's origin from the left edge, in pixels */
	originX;
	/** @type {number} the offset of the sprite's origin from the top edge, in pixels */
	originY;
	/** @type {number} the color index that will be considered transparent */
	transparent;
	/** @type {number[][]} the pixel matrix, each pixel holds the color index */
	pixels;
	/** @type {number} specifies a custom top value for the bounding box - this is used when computeBoundingBox() is called */
	bboxTop;
	/** @type {number} specifies a custom bottom value for the bounding box - this is used when computeBoundingBox() is called */
	bboxBottom;
	/** @type {number} specifies a custom left value for the bounding box - this is used when computeBoundingBox() is called */
	bboxLeft;
	/** @type {number} specifies a custom right value for the bounding box - this is used when computeBoundingBox() is called */
	bboxRight;
	/** @type {BoundingBox} the sprite's bounding box. In order to compute this, you must call computeBoundingBox() on the sprite. */
	bbox;
}
```

## Keyboard input <a name="keyboard-input"></a>

There are two methods of using keyboard input:
1. Checking directly if a button is pressed at that moment

        if (dosemu.isKeyPressed("ArrowLeft") {...}

2. Subscribing to press/release events

        dosemu.onKeyDown(key => {...})
        dosemu.onKeyUp(key => {...})

## Mouse input <a name="mouse-input"></a>

Mouse position can be queried with

`dosemu.getMousePosition()` which returns [x,y] in virtual screen coordinates.

Mouse buttons can be queried similarly to keyboard buttons with

`dosemu.isMouseButtonDown(buttonIndex: number)` where buttonIndex is 0..3.

Mouse cursor can be shown or hidden using these functions:

```
dosemu.showMouse();
dosemu.hideMouse();
```

You can also subscribe to mouse events:

```
dosemu.onMouseUp((x, y, buttonIndex) => {...}); // The callback receives the position and button.
dosemu.onMouseDown((x, y, buttonIndex) => {...}); // The callback receives the position and button.
dosemu.onMouseMove((x, y, dx, dy) => {...}); // The callback receives the position and distance moved since last time.
```

## Sound & Music <a name="sound-and-music"></a>

Dosemu supports synthesizing sound and music that has a distinct 8-bit monophonic sound, similar to what could be achieved
using the internal PC speaker in old PCs.
Due to browsers blocking sound until a user gesture is performed on the page, dosemu shows an **unmute** button in the
lower-right corner that the user must click before any sound can be played.
You can either let the user unmute by clicking this button, or you can manually call the `dosemuSound.unmute()` function in a
mouse or keyboard callback function (it must be called as a consequence of a user action, otherwise the browser will block it)
to unmute programatically.

In order for the sound to progress from one tone to another, you must call the `dosemuSound.update(dt)` function regularly (
ideally in short succession, such as at every frame) with the time interval that has passed since the last invokation.

*		dosemuSound.init()
	Initializes the sound system

*		dosemuSound.unmute()
	If called from a user action callback, will programatically unmute the sound; Called automatically by the unmute button in the lower-right corner.

*		dosemuSound.setSoundStartedCallback(callback: () => void)
	Sets a callback that will be invoked at the moment the sound is unmuted. This can be used to start playing music from the begining only when the
	user unmutes the sound.

*		dosemuSound.sound(sequence: number[][], finishedCallback: () => void, waveForm: "sine" | "square" | "triangle" | "sawtooth" = "square")
	This is the primary function that plays sounds. Provide a sequence of notes (an array of pairs of note frequency value and duration),
	and optionally a callback that will be invoked when the sound finished playing and (optionally) the waveform to be used.
	The default value for the waveform is "square" which gives the most 8-bit-like sound, but if you want you can play around with other forms.

	> **Note sequence explanation**
	> `let seq = [[200, 0.1], [400, 0.2], [800, 0.15]];`
	>
	> This sequence is composed of three notes, the first with a frequency of 200 Hz and a duration of 0.1 seconds,
	> The second 400 Hz and 0.2 seconds, and third 800 Hz and 0.15 seconds

*		dosemuSound.loop(sequence: number[][], times = -1, finishedCallback: () => void, waveForm = "square")
	Same as `dosemuSound.sound()`, but loops a sound for a number of times (or indefinitely if **times == -1** which is the default).
	This is usually used for playing music in a loop.

*		dosemuSound.update(dt: number)
	Updates the sound engine, advancing all sequences by the given amount of time (**dt** is expressed in seconds).

## Tools <a name="tools"></a>

There are some tools included with this package, for helping you with converting resources to the proper format for dosemu.

### Sprite Converter <a name="spriteconv"></a>

This tool converts PNG images into JS modules that can be imported into your app.
```
npx spriteconv path/to/png originX? originY?
```
* The 1st argument is the path to the source PNG image
* the 2nd and 3rd arguments are optional and represent the coordinates (in pixels) of the origin of the sprite - if omitted, they will default to the center of the image
The transparent color is considered to be the color of the lower-left pixel. That means that if you want no transparency, then you must make that pixel a different color than the rest of your sprite.

The best results are produced when converting true-color (24 bits per pixel) images. The color conversion from the source image into the indexed palette is done automatically by the tool.

The tool will save a new file in the same path as the original, with the added extension ".js".
So, if you invoke it like this:
```npx spriteconv ./data/images/butterfly.png```
it will produce a file `./data/images/butterfly.png.js` with the following contents:
```
export default {"width":20,"height":20,"originX":10,"originY":10,"transparent":12,"pixels":[[...]]}
```
Assuming the image was 20x20 pixels and that the color in the lower-left corner resolved to the color 12 in the palette.
You can then import this into your app and pass it to `dosemu.drawSprite(...)`:
```
import butterflySprite form "./data/images/butterfly.png.js";
...
dosemu.drawSprite(30, 40, butterflySprite);
```
You can now use the `dosemuSprite.computeBoundingBox(butterflySprite)` to automatically compute a bounding box around your sprite, ignoring transparent pixels.

If you want to manually specify the bounding box, you can edit the sprite js file (butterfly.png.js in this case) and insert these properties (each of which is optional):
* `"bboxLeft": number`
* `"bboxRight": number`
* `"bboxTop": number`
* `"bboxBottom": number`

All of these take coordinates relative to the left and top edge of the image (coordinates grow towards the right and the bottom).
When these exist on a sprite, `dosemuSprite.computeBoundingBox()` will use them instead of automatically computing the limits.

### MIDI Converter <a name="midiconv"></a>

This tool converts MIDI music files (*.mid) into a format that can be imported and played in dosemu directly.
The conversion is not lossless, since many MIDI files contain multiple tracks and instruments, creating a rich polyphony. Dosemu doesn't support polyphony, so the conversion will merge all tracks into a single sequence and the instrument data will be discarded.
```
npx midiconv ./data/music/music1.mid
```
This will produce a file in the same location, with '.js' appended: `./data/music/music1.mid.js` that contains a note sequence which can be directly played by dosemu:
```
import myMusic1 from "./data/music/music1.mid.js"
...
dosemuSound.loop(myMusic1)
```
