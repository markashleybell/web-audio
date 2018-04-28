// Original JS source from https://github.com/maryrosecook/drum-machine
// Annotated JS source here: http://drum-machine.maryrosecook.com/docs/drum-machine.html

interface IPoint {
    x: number;
    y: number;
}

interface ISequencerTrack {
    steps: boolean[];
    color: any;
    playSound: any;
}

interface ISequencerState {
    step: number;
    tracks: ISequencerTrack[];
}

declare const AUDIO_CONTEXT: AudioContext;

const RENDERING_CONTEXT = (document.getElementById('screen') as HTMLCanvasElement).getContext('2d');

const TEMPO = 120;
const BUTTON_SIZE = 39;

// Create the data for the drum machine.
const SEQUENCER_DATA: ISequencerState = {
    // `step` represents the current step (or beat) of the loop.
    step: 0,
    // `tracks` holds the six tracks of the drum machine.  Each track
    // has a sound and sixteen steps (or beats).
    tracks: [
        createTrack('gold', note(AUDIO_CONTEXT, 880)),
        createTrack('gold', note(AUDIO_CONTEXT, 659)),
        createTrack('gold', note(AUDIO_CONTEXT, 587)),
        createTrack('gold', note(AUDIO_CONTEXT, 523)),
        createTrack('gold', note(AUDIO_CONTEXT, 440)),
        createTrack('dodgerblue', kick(AUDIO_CONTEXT))
    ]
};

let paused = false;

setInterval(() => {
    if (paused) {
        return;
    }

    // Increase `data.step` by one.  If `data.step` is `15` (the last
    // step) loop back around to `0` (the first step).
    SEQUENCER_DATA.step = (SEQUENCER_DATA.step + 1) % SEQUENCER_DATA.tracks[0].steps.length;

    // Find all the tracks where the current step is on.  Play the
    // sounds for those tracks.
    SEQUENCER_DATA.tracks.filter(track => track.steps[SEQUENCER_DATA.step])
        .forEach(track => track.playSound());
}, TEMPO);

// **draw()** draws the drum machine.  Called once at the beginning of
// the program.  It's then called 60 times a second forever (see the
// call to `requestAnimationFrame()` below).
(function draw() {

    // Clear away the previous drawing.
    RENDERING_CONTEXT.clearRect(0, 0, RENDERING_CONTEXT.canvas.width, RENDERING_CONTEXT.canvas.height);

    // Draw all the tracks.
    drawTracks(RENDERING_CONTEXT, SEQUENCER_DATA);

    // Draw the pink square that indicates the current step (beat).
    drawButton(RENDERING_CONTEXT, SEQUENCER_DATA.step, SEQUENCER_DATA.tracks.length, 'deeppink');

    // Ask the browser to call `draw()` again in the near future.
    requestAnimationFrame(draw);
})();

// Handle events
// -------------

// **setupButtonClicking()** sets up the event handler that will make
// mouse clicks turn track buttons on and off.
(function setupButtonClicking() {

    // Every time the user clicks on the canvas...
    RENDERING_CONTEXT.canvas.addEventListener('click', e => {

        // ...Get the coordinates of the mouse pointer relative to the
        // canvas...
        const p = { x: e.offsetX, y: e.offsetY };

        // If we're off the bottom of the tracks listing,
        // they tapped the play bar;  use that to pause/unpause
        if (p.y > (BUTTON_SIZE * SEQUENCER_DATA.tracks.length * 1.5 + BUTTON_SIZE / 2)) {
            paused = !paused;
            return;
        }

        // ...Go through every track...
        SEQUENCER_DATA.tracks.forEach((track, row) => {

            // ...Go through every button in this track...
            track.steps.forEach((on, column) => {

                // ...If the mouse pointer was inside this button...
                if (isPointInButton(p, column, row)) {

                    // ...Switch it off if it was on or on if it was off.
                    track.steps[column] = !on;
                }
            });
        });
    });
})();

// **note()** plays a note with a pitch of `frequency` for `1` second.
function note(audioContext: AudioContext, frequency: number) {
    return () => {
        const duration = 1;

        // Create the basic note as a sine wave.  A sine wave produces a
        // pure tone.  Set it to play for `duration` seconds.
        const sineWave = createSineWave(audioContext, duration);

        // Set the note's frequency to `frequency`.  A greater frequency
        // produces a higher note.
        sineWave.frequency.value = frequency;

        // Web audio works by connecting nodes together in chains.  The
        // output of one node becomes the input to the next.  In this way,
        // sound is created and modified.
        chain([

            // `sineWave` outputs a pure tone.
            sineWave,

            // An amplifier reduces the volume of the tone from 20% to 0
            // over the duration of the tone.  This produces an echoey
            // effect.
            createAmplifier(audioContext, 0.2, duration),

            // The amplified output is sent to the browser to be played
            // aloud.
            audioContext.destination]);
    };
}

// **kick()** plays a kick drum sound for `1` second.
function kick(audioContext: AudioContext) {
    return () => {
    const duration = 2;

    // Create the basic note as a sine wave.  A sine wave produces a
    // pure tone.  Set it to play for `duration` seconds.
    const sineWave = createSineWave(audioContext, duration);

    // Set the initial frequency of the drum at a low `160`.  Reduce
    // it to 0 over the duration of the sound.  This produces that
    // BBBBBBBoooooo..... drop effect.
    rampDown(audioContext, sineWave.frequency, 160, duration);

    // Web audio works by connecting nodes together in chains.  The
    // output of one node becomes the input to the next.  In this way,
    // sound is created and modified.
    chain([

        // `sineWave` outputs a pure tone.
        sineWave,

        // An amplifier reduces the volume of the tone from 40% to 0
        // over the duration of the tone.  This produces an echoey
        // effect.
        createAmplifier(audioContext, 0.4, duration),

        // The amplified output is sent to the browser to be played
        // aloud.
        audioContext.destination]);
    };
}

// **createSineWave()** returns a sound node that plays a sine wave
// for `duration` seconds.
function createSineWave(audioContext: AudioContext, duration: number) {

    // Create an oscillating sound wave.
    const oscillator = audioContext.createOscillator();

    // Make the oscillator a sine wave.  Different types of wave produce
    // different characters of sound.  A sine wave produces a pure tone.
    oscillator.type = 'sine';

    // Start the sine wave playing right now.
    oscillator.start(audioContext.currentTime);

    // Tell the sine wave to stop playing after `duration` seconds have
    // passed.
    oscillator.stop(audioContext.currentTime + duration);

    // Return the sine wave.
    return oscillator;
}

// **rampDown()** takes `value`, sets it to `startValue` and reduces
// it to almost `0` in `duration` seconds.  `value` might be the
// volume or frequency of a sound.
function rampDown(audioContext: AudioContext, value: AudioParam, startValue: number, duration: number) {
    value.setValueAtTime(startValue, audioContext.currentTime);
    value.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
}

// **createAmplifier()** returns a sound node that controls the volume
// of the sound entering it.  The volume is started at `startValue`
// and ramped down in `duration` seconds to almost `0`.
function createAmplifier(audioContext: AudioContext, startValue: number, duration: number) {
    const amplifier = audioContext.createGain();
    rampDown(audioContext, amplifier.gain, startValue, duration);
    return amplifier;
}

// **chain()** connects an array of `soundNodes` into a chain.  If
// there are three nodes in `soundNodes`, the output of the first will
// be the input to the second, and the output of the second will be
// the input to the third.
function chain(soundNodes: AudioNode[]) {
    for (let i = 0; i < soundNodes.length - 1; i++) {
        soundNodes[i].connect(soundNodes[i + 1]);
    }
}

// **createTrack()** returns an object that represents a track.  This
// track contains an array of {STEP_COUNT} steps.  Each of these are either on
// (`true`) or off (`false`).  It contains `color`, the color to draw
// buttons when they are on.  It contains `playSound`, the function
// that plays the sound of the track.
function createTrack(color: string | CanvasGradient | CanvasPattern, playSound: () => void) {
    const STEP_COUNT = 8;
    const steps: boolean[] = [];
    for (let i = 0; i < STEP_COUNT; i++) {
        steps.push(false);
    }

    const track: ISequencerTrack = { steps: steps, color: color, playSound: playSound };

    return track;
}

// **buttonPosition()** returns the pixel coordinates of the button at
// `column` and `row`.
function buttonPosition(column: number, row: number) {
    return {
        x: BUTTON_SIZE / 2 + column * BUTTON_SIZE * 1.5,
        y: BUTTON_SIZE / 2 + row * BUTTON_SIZE * 1.5
    };
}

// **drawButton()** draws a button in `color` at `column` and `row`.
function drawButton(renderingContext: CanvasRenderingContext2D, column: number, row: number, color: string | CanvasGradient | CanvasPattern) {
    const position = buttonPosition(column, row);
    renderingContext.fillStyle = color;
    renderingContext.fillRect(position.x, position.y, BUTTON_SIZE, BUTTON_SIZE);
}

// **drawTracks()** draws the tracks in the drum machine.
function drawTracks(renderingContext: CanvasRenderingContext2D, data: ISequencerState) {
    data.tracks.forEach((track, row) => {
        track.steps.forEach((on, column) => {
            drawButton(renderingContext,
                column,
                row,
                on ? track.color : 'lightgray');
        });
    });
}

// **isPointInButton()** returns true if `p`, the coordinates of a
// mouse click, are inside the button at `column` and `row`.
function isPointInButton(p: IPoint, column: number, row: number) {
    const b = buttonPosition(column, row);
    return !(p.x < b.x ||
        p.y < b.y ||
        p.x > b.x + BUTTON_SIZE ||
        p.y > b.y + BUTTON_SIZE);
}

function clear() {
    SEQUENCER_DATA.tracks.forEach(track => track.steps = track.steps.map(() => false));
}
