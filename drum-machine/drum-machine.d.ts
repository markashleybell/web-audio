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
    stepCount: number;
    tracks: ISequencerTrack[];
    currentStep: number;
    paused: boolean;
}
