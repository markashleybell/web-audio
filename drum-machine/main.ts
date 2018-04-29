// Original JS source from https://github.com/maryrosecook/drum-machine
// Annotated JS source here: http://drum-machine.maryrosecook.com/docs/drum-machine.html

// This variable is initialised in audio-context.js
declare const AUDIO_CONTEXT: AudioContext;

// Global constants

const RENDERING_CONTEXT = (document.getElementById('screen') as HTMLCanvasElement).getContext('2d');

const BUTTON_SIZE = 32;

const STEP_COUNT = 16;
const TEMPO = 140; // Bigger number is slower tempo, weirdly...

const SEQUENCER_STATE: ISequencerState = {
    stepCount: STEP_COUNT,
    tracks: [
        createTrack(STEP_COUNT, 'gold', note(AUDIO_CONTEXT, 880)),
        createTrack(STEP_COUNT, 'red', note(AUDIO_CONTEXT, 659)),
        createTrack(STEP_COUNT, 'green', note(AUDIO_CONTEXT, 587)),
        createTrack(STEP_COUNT, 'orange', note(AUDIO_CONTEXT, 523)),
        createTrack(STEP_COUNT, 'deeppink', note(AUDIO_CONTEXT, 440)),
        createTrack(STEP_COUNT, 'blue', kick(AUDIO_CONTEXT))
    ],
    currentStep: 0,
    paused: true
};

// Audio functions

function decaySine(
    audioContext: AudioContext,
    frequency: number,
    volume: number,
    duration: number,
    effect?: (audioContext: AudioContext, oscillator: OscillatorNode) => void) {
    return () => {
        const sineWaveOscillator = createSineWaveOscillator(audioContext, frequency, duration);
        if (effect) {
            effect(audioContext, sineWaveOscillator);
        }
        const decay = audioContext.createGain();
        rampDown(audioContext, decay.gain, volume, duration);
        // Connect the nodes to the output
        chain([sineWaveOscillator, decay, audioContext.destination]);
    };
}

function note(audioContext: AudioContext, frequency: number) {
    const duration = 1;
    const volume = 0.2;
    return decaySine(audioContext, frequency, volume, duration);
}

function kick(audioContext: AudioContext) {
    const frequency = 160;
    const volume = 0.4;
    const duration = 4;
    const effect = (ctx: AudioContext, osc: OscillatorNode) =>
        rampDown(ctx, osc.frequency, frequency, duration);
    return decaySine(audioContext, frequency, volume, duration, effect);
}

function createSineWaveOscillator(audioContext: AudioContext, frequency: number, duration: number) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const currentTime = audioContext.currentTime;
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
    return oscillator;
}

function rampDown(audioContext: AudioContext, parameter: AudioParam, startValue: number, duration: number) {
    const currentTime = audioContext.currentTime;
    parameter.setValueAtTime(startValue, currentTime);
    parameter.exponentialRampToValueAtTime(0.01, currentTime + duration);
}

function chain(soundNodes: AudioNode[]) {
    for (let i = 0; i < soundNodes.length - 1; i++) {
        soundNodes[i].connect(soundNodes[i + 1]);
    }
}

// Sequencing functions

function incrementStep(sequencerState: ISequencerState) {
    // Increment step, looping back to first if the current step was the last
    sequencerState.currentStep = (sequencerState.currentStep + 1) % sequencerState.stepCount;
    return sequencerState.currentStep;
}

function nextStep(sequencerState: ISequencerState) {
    if (sequencerState.paused) { return; }
    const step = incrementStep(sequencerState);
    sequencerState.tracks
        .filter(track => track.steps[step])
        .forEach(track => track.playSound());
}

function createTrack(stepCount: number, color: string | CanvasGradient | CanvasPattern, playSound: () => void) {
    return {
        steps: new Array(stepCount).fill(false),
        color: color,
        playSound: playSound
    } as ISequencerTrack;
}

function clear(sequencerState: ISequencerState) {
    sequencerState.tracks.forEach(track => track.steps = track.steps.map(() => false));
}

function toggleStep(sequencerState: ISequencerState, clickPosition: IPoint) {
    sequencerState.tracks.forEach((track, row) => {
        track.steps.forEach((on, column) => {
            const buttonPosition = getButtonPosition(column, row);
            if (withinButton(buttonPosition, clickPosition)) {
                track.steps[column] = !on;
            }
        });
    });
}

// Graphics functions

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
            drawButton(renderingContext, column, row, on ? track.color : 'lightgray');
        });
    });
}

function withinButton(buttonPosition: IPoint, position: IPoint) {
    return !(position.x < buttonPosition.x ||
             position.y < buttonPosition.y ||
             position.x > buttonPosition.x + BUTTON_SIZE ||
             position.y > buttonPosition.y + BUTTON_SIZE);
}

function draw(renderingContext: CanvasRenderingContext2D, sequencerState: ISequencerState) {
    renderingContext.clearRect(0, 0, renderingContext.canvas.width, renderingContext.canvas.height);
    drawTracks(renderingContext, sequencerState);
    // Draw the current step indicator
    drawButton(renderingContext, sequencerState.currentStep, sequencerState.tracks.length, 'black');
    requestAnimationFrame(() => draw(renderingContext, sequencerState));
}

RENDERING_CONTEXT.canvas.addEventListener('click', e => {
    // Coordinates are relative to the canvas
    const mousePosition: IPoint = { x: e.offsetX, y: e.offsetY };

    // If we're off the bottom of the track listing, they tapped the play bar, so pause/unpause
    if (mousePosition.y > (BUTTON_SIZE * SEQUENCER_STATE.tracks.length * 1.5 + BUTTON_SIZE / 2)) {
        SEQUENCER_STATE.paused = !SEQUENCER_STATE.paused;
        return;
    }

    toggleStep(SEQUENCER_STATE, mousePosition);
});

// 'Program in' a basic 4/4 beat
SEQUENCER_STATE.tracks[5].steps[0] = true;
SEQUENCER_STATE.tracks[5].steps[4] = true;
SEQUENCER_STATE.tracks[5].steps[8] = true;
SEQUENCER_STATE.tracks[5].steps[12] = true;

draw(RENDERING_CONTEXT, SEQUENCER_STATE);
setInterval(() => nextStep(SEQUENCER_STATE), TEMPO);
