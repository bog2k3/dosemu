const RAMP_UP_TIME = 0.1;
const RAMP_DOWN_TIME = 0.5;

class Player {
	/** @type {OscillatorNode} */
	oscillatorNode = null;
	/** @type {GainNode} */
	gainNode = null;
	/** @type {number[][]} a list of pairs of numbers, each pair describes a note's freq and duration */
	sequence = null;
	/** @type {"sine" | "square" | "triangle" | "sawtooth"} */
	waveForm = "sine";
	/** @type {number} */
	crtNoteIndex = 0;
	/** @type {number} */
	timeInCrtNote = 0;
	finished = false;
	/** @type {() => void} */
	onFinishedCallback = null;
	/** @type {number} */
	loopsRemaining = 1;

	/**
	 *
	 * @param audioCtx {AudioContext}
	 * @param sequence {number[][]}
	 * @param waveForm
	 */
	constructor(audioCtx, sequence, waveForm="square", onFinishedCallback=null, loops=1) {
		this.oscillatorNode = audioCtx.createOscillator();
		this.gainNode = audioCtx.createGain();
		this.oscillatorNode.connect(this.gainNode);
		this.gainNode.connect(audioCtx.destination);
		this.oscillatorNode.channelCount = 1;
		this.oscillatorNode.type = this.sanitizeWaveForm(waveForm);

		this.sequence = sequence;
		this.onFinishedCallback = onFinishedCallback;
		this.loopsRemaining = loops;

		this.reset();
		this.oscillatorNode.start();
	}

	sanitizeWaveForm(waveForm) {
		if (["sine", "square", "triangle", "sawtooth"].includes(waveForm))
			return waveForm;
		else
			return "sine";
	}

	update(dt) {
		this.timeInCrtNote += dt;
		if (this.crtNoteIndex < this.sequence.length && this.timeInCrtNote > this.sequence[this.crtNoteIndex][1] && this.crtNoteIndex < this.sequence.length) {
			// time to move to the next note
			this.crtNoteIndex++;
			if (this.crtNoteIndex == this.sequence.length) {
				// finished
				this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.gainNode.context.currentTime + RAMP_DOWN_TIME);
				setTimeout(() => this.loopOrStop(), RAMP_DOWN_TIME * 1000);
			} else {
				this.oscillatorNode.frequency.value = this.sequence[this.crtNoteIndex][0];
				this.timeInCrtNote = 0;
			}
		}
	}

	loopOrStop() {
		if (this.loopsRemaining != 0) {
			// loop
			this.reset();
			console.log("loop");
		} else {
			this.cleanUp();
		}
	}

	reset() {
		if (this.loopsRemaining > 0) // if negative, we leave it as it is
			this.loopsRemaining--;
		this.timeInCrtNote = 0;
		this.crtNoteIndex = 0;
		this.gainNode.gain.setValueAtTime(0.00001, this.gainNode.context.currentTime);
		this.gainNode.gain.exponentialRampToValueAtTime(0.35, this.gainNode.context.currentTime + RAMP_UP_TIME);
		this.oscillatorNode.frequency.value = this.sequence[0][0];
	}

	cleanUp() {
		this.oscillatorNode.stop();
		this.gainNode.disconnect();
		this.oscillatorNode.disconnect();
		if (this.onFinishedCallback) {
			this.onFinishedCallback();
		}
	}
}

const data = {
	/** @type {AudioContext} */
	audioCtx: null,
	/** @type {Player[]} */
	players: [],
	soundStartedCallback: null
};

export function init() {
	data.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	data.audioCtx.suspend();
}

/** this must be called as a consequence of a user interaction in order to resume the audio context. */
export function unmute() {
	data.audioCtx.resume();
	if (data.soundStartedCallback) {
		data.soundStartedCallback();
	}
}

/**
 * Sets a callback to be invoked when the user unmutes the sound.
 * This can be used for example to start playing some music.
 * @param {() => void} callback
 */
export function setSoundStartedCallback(callback) {
	data.soundStartedCallback = callback;
}

/**
 * Plays a sound sequence.
 * @param {number[][]} seq an array of pairs of (freq, duration) values - the notes to be played
 * @param {"sine" | "square" | "triangle" | "sawtooth"} waveForm the type of wave for this sound sequence
 * @param {() => void} onFinishedCallback a callback to be invoked when the sound finished playing
 */
export function sound(seq, onFinishedCallback=null, waveForm="square") {
	data.players.push(new Player(
		data.audioCtx, seq, waveForm, onFinishedCallback
	));
}

/**
 * Plays a sound in a loop for a given number of times (if -1, then loops indefinitely)
 * @param {number[][]} seq an array of pairs of (freq, duration) values - the notes to be played
 * @param {number} times -1 for infinite loop, or positive for a fixed number of loops.
 * @param {"sine" | "square" | "triangle" | "sawtooth"} waveForm the type of wave for this sound sequence
 * @param {() => void} onFinishedCallback a callback to be invoked when the loop finished playing
 */
export function loop(seq, times=-1, onFinishedCallback=null, waveForm="square") {
	data.players.push(new Player(
		data.audioCtx, seq, waveForm, onFinishedCallback, times
	));
}

/**
 * Updates the sound engine, progressing all currently playing sounds and stopping expired ones
 * @param dt time delta since last update, in seconds
 */
export function update(dt) {
	for (let i=0; i<data.players.length; ) {
		data.players[i].update(dt);
		if (data.players[i].finished)
			data.players.splice(i, 1);
		else
			i++;
	}
}
