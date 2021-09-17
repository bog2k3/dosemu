# DOSEMU - a library for emulating DOS VGA graphics look and feel into an HTML5 Canvas

If you feel nostalgic about the look and feel of old DOS games, this library helps you recreate that into the browser.

## Usage notes

The library is packed as ES6 Modules, thus you'll need to specify
```type="module" ```
on the script tag for the entry-point into your application, then
use ES6-style imports in your source files:
```import * as dosemu from 'dosemu'; ```


## Check out the examples

Since ES6 imports require an HTTP server, to run the examples start up an HTTP server in the root of the dosemu package (npm http-server will do), then navigate to
```http://localhost:8080/examples/name-of-example```

## Getting started

The examples should provide a straight-forward way of how to use the library, but
here's a quick guide nonetheless:
1. Import dosemu
```import * as dosemu from 'dosemu';```

2. Initialize dosemu by giving it a reference to your "screen" element
(where the canvas will be created by dosemu) and a reference to a "console" element
(where dosemu will create a console to display output from your code).
You do not need to create the canvas by yourself, in fact you shouldn't.
```dosemu.init(document.querySelector("#emuscreen"), document.querySelector("#emuconsole"));```

3. Set up the game-loop in your preferred way
4. Write your frame render function, by using the various draw* functions from dosemu

        dosemu.clearScreen();
        dosemu.drawPixel(100, 150, 15); // draw a pixel at location (100, 150) in color 15
        dosemu.drawLine(10, 10, 20, 20, 3); // draw a line from (10, 10) to (20, 20) in color 3
        // and so on - all draw functions are covered below.

## Graphics

The dosemu screen has a fixed resolution of **320 x 200** pixels just like the old "mode 13" in DOS.
The colors are 8 bits per pixel, indexed, giving a palette of **256** possible colors.
Each draw function accepts a number between 0..255 as the color index.
The drawing is double-buffered, meaning the draw functions operate on a back-buffer, not directly onto the screen, and this buffer is perioadically copied over to the screen; this achieves flicker-free drawing.
The coordinates of the virtual screen are **(0, 0)** for the upper left corner, growing to the right and down up to **(319, 199)** for the bottom-right corner.

## Draw functions

* ```clearScreen()```
Clears the entire frame buffer
* ```drawPixel(x, y, color)```
Draws a single pixel at position (**x**,**y**) in the given color (**0**..**255**)
* ```drawText(x, y, text, color, aligment="left")```
Draws a text anchored at a given position, in a specified color.
The alignment can be one of **"left"** | **"right"** | **"center"**. The position of the text relative to the anchor point is determined by the alignment.
Text is rendered using a monospaced bitmap VGA font that is **8** pixels wide and **10** pixels high for each character.
* ```drawBar(xLeft, yTop, xRight, yBottom, color)```
Draws a "bar" (which is a filled rectangle) from the (**xLeft**, **yTop**) coordinates down and right to (**xRight**, **yBottom**) inclusive.
**xRight** is assumed to be greater-than-or-equal to **xLeft**.
**yBottom** is assumed to be greater-than-or-equal to **yTop**.
* ```drawRectangle(xLeft, yTop, xRight, yBottom, color)```
Draws a rectangle from the (**xLeft**, **yTop**) coordinates down and right to (**xRight**, **yBottom**) inclusive.
**xRight** is assumed to be greater-than-or-equal to **xLeft**.
**yBottom** is assumed to be greater-than-or-equal to **yTop**.
* ```drawLine(x1, y1, x2, y2, color)```
Draws a straight line from (**x1**, **y1**) to (**x2**, **y2**) inclusive.
The coordinates can be given in any order in this case.
* ```drawCircle(x, y, radius, color)```
Draws a circle centered at (**x**, **y**) with a radius of **r**, in the specified color.
* ```drawSprite(x, y, sprite)```
Draws a sprite at position (**x**, **y**). See [Sprites](#Sprites) below
* ```drawBBox(bbox, color)```
Draws a bounding-box (**bbox**) expressed in screen-space, using the given **color**. See [Bounding Boxes](#BBox) below.
This can be used for debug purposes, since a bounding box is basically a rectangle, so there's no other use case for this function.

## Color palette

The color palette can be visualized by running the "palette" example. Each color is numbered for easy reference.
This is the standard VGA 256 color palette used in old DOS applications and games.

## <a name="Sprites"></a>Sprites
A sprite is an object containing a pixel matrix and some metadata - see the class definition below.
A sprite can be either written manually (not recommended) or obtained from a PNG image by using the `spriteconv` tool included - see [Tools](#tools).
The **bbox** field can be computed automatically using the `computeBBox()` function in **dosemu-sprites** - this will compute a tight bounding box around the visible pixels of the sprite, ignoring any transparent pixels.
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

## Keyboard input

There are two methods of using keyboard input:
1. Checking directly if a button is pressed at that moment

        if (dosemu.isKeyPressed("ArrowLeft") {...}

2. Subscribing to press/release events

        dosemu.onKeyDown(key => {...})
        dosemu.onKeyUp(key => {...})

## Mouse input
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

## Sound & Music

TODO

## <a name="tools"></a> Tools
