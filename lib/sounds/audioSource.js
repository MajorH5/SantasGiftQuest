import { Constants } from "../misc/constants.js";

export const AudioSource = (function () {
    return class AudioSource {
        // class for managing audio data
        constructor (src, audioContext) {
            this.src = Constants.ORIGIN + src;
            this.audioContext = audioContext;
            this.buffer = null;
            this.loaded = false;
        }

        // loads in the audio data
        // from the given source
        async load () {
            this.buffer = await fetch(this.src)
                .then(response => response.arrayBuffer())
                .then(buffer => this.audioContext.decodeAudioData(buffer))
                .catch(e => {
                    console.error(`There was an error loading sound ${this.src}\n\t${e}`);
                    return null;
                });
            this.loaded = true;
        }

        // returns true if the audio
        // data has been loaded
        isLoaded () {
            return this.buffer !== null && this.loaded;
        }

        // returns the audio data
        getBuffer () {
            return this.buffer;
        }

        // returns the audio context
        getAudioContext () {
            return this.audioContext;
        }

        // returns the audio source
        getAudioSource () {
            return this.src;
        }
    }
})();