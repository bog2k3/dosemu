const fs = require("fs");

/** font file structure:
 * OFFS		NAME		SIZE (BYTES)	COMMENT
 * 0		WIDTH		1				char width, in pixels (max 8)
 * 1		HEIGHT		1				char height, in pixels (max 10)
 *
 * (repeats 256 times for i=0..255)
 * 2+i*10	CHAR_i		10				each character is a sequence of 10 bytes, each byte representing a line (each bit is a pixel)
 *
 */

const buf = fs.readFileSync(process.argv[2], {});
const charWidth = buf[0];
const charHeight = buf[1];
const charData = [];
for (let i=0; i<256; i++) {
	const offs = 2 + i * 10;
	const charBytes = [];
	for (let line=0; line<10; line++)
		charBytes.push(buf[offs + line]);
	charData.push(toCharData(charBytes));
}

fs.writeFileSync(`${process.argv[2]}.js`, JSON.stringify({
	charWidth,
	charHeight,
	charData
}));

function toCharData(bytes) {
	let charData = [];
	for (let i=0; i<10; i++) {
		const charLine = [];
		for (let j=0; j<8; j++) {
			charLine.push((bytes[i] & (1 << j)) !== 0 ? 1 : 0);
		}
		charData.push(charLine);
	}
	return charData;
}
