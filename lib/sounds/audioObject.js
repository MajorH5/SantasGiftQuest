import { Event } from "/lib/PhysicsJS2D/src/event.js";

export const AudioObject = (function () {
    return class AudioObject {
        // creates a new audio context
        constructor (audioSource) {
            this.audioSource = audioSource;
            this.audioContext = audioSource.getAudioContext();
            this.buffer = audioSource.getBuffer();
            this.src = audioSource.getAudioSource();

            this.playbackRate = 1;
            this.volume = 1;
            this.loop = false;
            
            // source -> gain -> audioContext -> destination
            this.source = this.audioContext.createBufferSource();
            this.source.loop = this.loop;
            this.source.buffer = this.buffer;
            this.source.playbackRate.value = this.playbackRate;
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.volume;
            
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this.playing = false;
            this.completed = false;

            this.played = new Event();
            this.stopped = new Event();

            this.source.addEventListener('ended', () => {
                this.completed = true;
                this.stopped.trigger();
            });
        }

        // plays the audio from the beginning
        play (timePosition) {
            if (this.playing || this.completed) return;

            this.source.start(0, timePosition);
            this.playing = true;
            this.played.trigger();
        }

        // pauses the audio at the current position
        pause () {
            if (!this.playing || this.completed) return;

            this.source.stop();
            this.playing = false;
            this.stopped.trigger();
        }

        // resumes the audio from the current position
        resume () {
            if (this.playing || this.completed) return;

            this.audioContext.resume();
            this.playing = true;
            this.played.trigger();
        }

        // returns true if the audio is currently playing
        isPlaying () {
            return this.playing;
        }

        // sets the loop property of the audio
        setLoop (loop) {
            this.loop = loop;
            this.source.loop = loop;
        }

        // sets the volume of the audio
        setVolume (volume) {
            this.volume = volume;
            this.gainNode.gain.value = volume;
        }

        // sets the playback rate of the audio
        setPlaybackRate (playbackRate) {
            this.playbackRate = playbackRate;
            this.source.playbackRate.value = playbackRate;
        }
    }
})();