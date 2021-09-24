#!/usr/bin/env node

import * as fs from "fs";
import Midi from "@tonejs/midi";

const midiKeyValues = [
	8.18,8.66,9.18,9.72,10.3,10.91,11.56,12.25,12.98,13.75,14.57,15.43,16.35,17.32,18.35,19.45,20.6,21.83,23.12,24.5,25.96,27.5,29.14,30.87,32.7,34.65,36.71,38.89,41.2,43.65,46.25,49,51.91,55,58.27,61.74,65.41,69.3,73.42,77.78,82.41,87.31,92.5,98,103.83,110,116.54,123.47,130.81,138.59,146.83,155.56,164.81,174.61,185,196,207.65,220,233.08,246.94,261.63,277.18,293.66,311.13,329.63,349.23,369.99,392,415.3,440,466.16,493.88,523.25,554.37,587.33,622.25,659.26,698.46,739.99,783.99,830.61,880,932.33,987.77,1046.5,1108.73,1174.66,1244.51,1318.51,1396.91,1479.98,1567.98,1661.22,1760,1864.66,1975.53,2093,2217.46,2349.32,2489.02,2637.02,2793.83,2959.96,3135.96,3322.44,3520,3729.31,3951.07,4186.01,4434.92,4698.64,4978.03,5274.04,5587.65,5919.91,6271.93,6644.88,7040,7458.62,7902.13,8372.02,8869.84,9397.27,9956.06,10548.08,11175.3,11839.82,12543.85
];

function mergeTracks(midiData) {
	if (midiData.tracks.length <= 1)
		return;
	const mergedTrack = [];
	const trackHead = [];
	for (let i=0; i<midiData.tracks.length; i++) {
		if (!midiData.tracks[i].notes.length)
			continue;
		trackHead.push({
			trackId: i,
			offs: 0
		});
	}
	while (trackHead.length) {
		let minI=-1;
		let minTicks=-1;
		for (let i=0; i<trackHead.length; i++) {
			const head = trackHead[i];
			if (minTicks === -1 || midiData.tracks[head.trackId].notes[head.offs].ticks < minTicks) {
				minTicks = midiData.tracks[head.trackId].notes[head.offs].ticks;
				minI = i;
			}
		}
		mergedTrack.push(midiData.tracks[trackHead[minI].trackId].notes[trackHead[minI].offs]);
		trackHead[minI].offs++;
		if (trackHead[minI].offs >= midiData.tracks[trackHead[minI].trackId].notes.length) {
			trackHead.splice(minI, 1);
		}
	}
	midiData.tracks = [{
		notes: mergedTrack
	}];
}

function convertMidi(midiData) {
	let lastTime = 0;
	const notes = [];
	mergeTracks(midiData);
	for (let i=0; i<midiData.tracks[0].notes.length; i++) {
		const midiNote = midiData.tracks[0].notes[i];
		// midiNote: {midi (key id), ticks (offset), durationTicks (length)}
		const crtTime = midiNote.time;
		// check if there are other higher keys at the same time as this one, and if so, ignore it
		let ignore = false;
		for (let j=i-1; j>=0; j--) {
			if (midiData.tracks[0].notes[j].ticks < midiNote.ticks)
				break;
			if (midiData.tracks[0].notes[j].midi > midiNote.midi) {
				ignore = true;
				break;
			}
		}
		for (let j=i+1; j<midiData.tracks[0].notes.length; j++) {
			if (midiData.tracks[0].notes[j].ticks > midiNote.ticks)
				break;
			if (midiData.tracks[0].notes[j].midi > midiNote.midi) {
				ignore = true;
				break;
			}
		}
		if (!ignore) {
			if (crtTime > lastTime) {
				// there was a gap between notes, we insert silence
				notes.push([0, crtTime - lastTime]);
			}
			notes.push([midiKeyValues[midiNote.midi], midiNote.duration]);
			lastTime = crtTime + midiNote.duration;
		}
	}
	notes.push([0, 0]);
	fs.writeFileSync(`${process.argv[2]}.js`, `export default ${JSON.stringify(notes)}`);
}

(function main() {
	const data = fs.readFileSync(process.argv[2]);
	const midiData = new Midi.Midi(data);
	convertMidi(midiData);
})();
