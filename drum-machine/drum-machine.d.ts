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
    paused: boolean;
}
