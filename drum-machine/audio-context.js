// Declare the object that contains functions that use web audio to
// make sound. We don't assign it yet because we have to do that in
// response to a user interaction.
var AUDIO_CONTEXT;

// Support iOS:
// https://gist.github.com/laziel/7aefabe99ee57b16081c
(function () {
    var usingWebAudio = true;

    try {
        if (typeof AudioContext !== 'undefined') {
            AUDIO_CONTEXT = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
            AUDIO_CONTEXT = new webkitAudioContext();
        } else {
            usingWebAudio = false;
        }
    } catch (e) {
        usingWebAudio = false;
    }

    // context state at this time is `undefined` in iOS8 Safari
    if (usingWebAudio && AUDIO_CONTEXT.state === 'suspended') {
        var resume = function () {
            AUDIO_CONTEXT.resume();

            setTimeout(function () {
                if (AUDIO_CONTEXT.state === 'running') {
                    document.body.removeEventListener('touchend', resume, false);
                }
            }, 0);
        };

        document.body.addEventListener('touchend', resume, false);
    }
}());
