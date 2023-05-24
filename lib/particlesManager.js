import { ParticleEmitter } from "./particleEmitter.js";
import { Settings } from "./settings.js";

export const ParticlesManager = (function () {
    return class ParticlesManager {
        // creates a new particle manager
        constructor () {
            this.emitters = [];
            this.cleared = false; // used to clear all emitters when the global particles setting is disabled
        }

        // clears all active particle emitters
        clear () {
            // refs to the emitters are mainly kept in the manager
            this.emitters = [];
        }

        // creates a new particle emitter
        createEmitter (properties) {
            const emitter = new ParticleEmitter(properties, this);
            this.addEmitter(emitter);
            return emitter;
        }

        // creates a new particle emitter
        // and emits the specified ammount of particles
        emit (amount, properties) {
            const emitter = new ParticleEmitter(properties, this);
            emitter.emit(amount);
            this.addEmitter(emitter);
            return emitter;
        }


        // adds a new particle emitter to the manager
        addEmitter (emitter) {
            if (!Settings.GlobalParticlesEnabled){
                return;
            }

            if (!this.emitters.includes(emitter)){
                this.emitters.push(emitter);
            }
        }

        // removes a particle emitter from the manager
        removeEmitter (emitter) {
            const index = this.emitters.indexOf(emitter);

            if (index >= 0) {
                this.emitters.splice(index, 1);
            }
        }

        // updates all the particle emitters
        update (deltaTime) {
            if (!Settings.GlobalParticlesEnabled) {
                if (this.emitters.length > 0 && !this.cleared) {
                    this.emitters.forEach((emitter) => {
                        emitter.stop();
                    });
                    this.cleared = true;
                }
            } else if (this.cleared) {
                this.cleared = false;
            }

            this.emitters.forEach((emitter) => {
                if (!emitter.isRunning){
                    this.removeEmitter(emitter);
                    return;
                }

                emitter.update(deltaTime);
            });
        }

        // renders all the particle emitters
        render (context, offset, scale) {
            if (!Settings.GlobalParticlesEnabled) {
                return;
            }
            
            this.emitters.forEach((emitter) => {
                emitter.render(context, offset, scale);
            });
        }
    }
})();