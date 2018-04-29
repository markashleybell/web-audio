// Original JS source from https://github.com/maryrosecook/drum-machine
// Annotated JS source here: http://drum-machine.maryrosecook.com/docs/drum-machine.html

declare const AUDIO_CONTEXT: AudioContext;

const RENDERING_CONTEXT = (document.getElementById('screen') as HTMLCanvasElement).getContext('2d');

const BUTTON_SIZE = 39;

const STEP_COUNT = 8;
const TEMPO = 300; // Bigger number is slower tempo, weirdly...

const SEQUENCER_STATE: ISequencerState = {
    step: 0,
    tracks: [
        createTrack('gold', note(AUDIO_CONTEXT, 880)),
        createTrack('gold', note(AUDIO_CONTEXT, 659)),
        createTrack('gold', note(AUDIO_CONTEXT, 587)),
        createTrack('gold', note(AUDIO_CONTEXT, 523)),
        createTrack('gold', note(AUDIO_CONTEXT, 440)),
        createTrack('dodgerblue', kick(AUDIO_CONTEXT))
    ],
    paused: true
};

function nextStep(sequencerState: ISequencerState) {
    if (sequencerState.paused) {
        return;
    }

    // Increment step, looping back to first if the current step was the last
    sequencerState.step = (sequencerState.step + 1) % STEP_COUNT;

    sequencerState.tracks
        .filter(track => track.steps[sequencerState.step])
        .forEach(track => track.playSound());
}

function draw(sequencerState: ISequencerState) {
    // Clear away the previous drawing.
    RENDERING_CONTEXT.clearRect(0, 0, RENDERING_CONTEXT.canvas.width, RENDERING_CONTEXT.canvas.height);
    drawTracks(RENDERING_CONTEXT, sequencerState);

    // Draw the pink square that indicates the current step (beat).
    drawButton(RENDERING_CONTEXT, sequencerState.step, sequencerState.tracks.length, 'deeppink');

    // Ask the browser to call `draw()` again in the near future.
    requestAnimationFrame(() => draw(sequencerState));
}

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

function createSineWave(audioContext: AudioContext, duration: number) {

    // Create an oscillating sound wave.
    const oscillator = audioContext.createOscillator();

    // Make the oscillator a sine wave.  Different types of wave produce
    // different characters of sound.  A sine wave produces a pure tone.
    oscillator.type = 'sine';

    // Start the sine wave playing right now.
    oscillator.start(audioContext.currentTime);

    // Tell the sine wave to stop playing after `duration` seconds have passed.
    oscillator.stop(audioContext.currentTime + duration);

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

function chain(soundNodes: AudioNode[]) {
    for (let i = 0; i < soundNodes.length - 1; i++) {
        soundNodes[i].connect(soundNodes[i + 1]);
    }
}

function createTrack(color: string | CanvasGradient | CanvasPattern, playSound: () => void) {
    return {
        steps: new Array(STEP_COUNT).fill(false),
        color: color,
        playSound: playSound
    } as ISequencerTrack;
}

function getButtonPosition(column: number, row: number) {
    return {
        x: BUTTON_SIZE / 2 + column * BUTTON_SIZE * 1.5,
        y: BUTTON_SIZE / 2 + row * BUTTON_SIZE * 1.5
    } as IPoint;
}

function drawButton(renderingContext: CanvasRenderingContext2D, column: number, row: number, color: string | CanvasGradient | CanvasPattern) {
    const position = getButtonPosition(column, row);
    renderingContext.fillStyle = color;
    renderingContext.fillRect(position.x, position.y, BUTTON_SIZE, BUTTON_SIZE);
}

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

function pointWithinButton(point: IPoint, buttonPoint: IPoint) {
    return !(point.x < buttonPoint.x ||
             point.y < buttonPoint.y ||
             point.x > buttonPoint.x + BUTTON_SIZE ||
             point.y > buttonPoint.y + BUTTON_SIZE);
}

function clear(sequencerState: ISequencerState) {
    sequencerState.tracks.forEach(track => track.steps = track.steps.map(() => false));
}

RENDERING_CONTEXT.canvas.addEventListener('click', e => {
    // Get the coordinates of the mouse pointer relative to the canvas
    const mousePosition: IPoint = { x: e.offsetX, y: e.offsetY };

    // If we're off the bottom of the track listing, they tapped the play bar, so pause/unpause
    if (mousePosition.y > (BUTTON_SIZE * SEQUENCER_STATE.tracks.length * 1.5 + BUTTON_SIZE / 2)) {
        SEQUENCER_STATE.paused = !SEQUENCER_STATE.paused;
        return;
    }

    SEQUENCER_STATE.tracks.forEach((track, row) => {
        track.steps.forEach((on, column) => {
            const buttonPoint = getButtonPosition(column, row);
            // ...If the mouse pointer was inside this button...
            if (pointWithinButton(mousePosition, buttonPoint)) {
                track.steps[column] = !on;
            }
        });
    });
});

draw(SEQUENCER_STATE);
setInterval(() => nextStep(SEQUENCER_STATE), TEMPO);
