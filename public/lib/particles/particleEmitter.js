import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Settings } from '../misc/settings.js';
import { Particle } from './particle.js';

export const ParticleEmitter = (function () {
    return class ParticleEmitter {
        static DEFAULT_PROPERTIES = {
            color: {
                start: '#ffffff',
                finish: '#ffffff'
            },
            opacity: {
                start: 1,
                finish: 0
            },
            rotation: {
                start: 0,
                finish: 0
            },
            size: {
                start: new Vector2(20, 20),
                finish: new Vector2(10, 10)
            },

            confetti: false,
            sprite: null,
            
            rate: (1 / 5) * 1000,
            amount: 3,
            lifetime: 0.5 * 1000,
            speed: 20,
            gravity: 0,
            velocity: new Vector2(0, 0),
            position: new Vector2(0, 0),
            
            sizeVariation: new Vector2(5, 5),
            velocityVariation: new Vector2(10, 10),
        };

        // creates a new particle emitter which managels
        constructor (properties = {}, manager) {
            this.manager = manager;
            this.isRunning = false;
            this.continous = false;
            this.particles = [];
            this.lastEmission = -Infinity;
            this.properties = Object.assign({}, ParticleEmitter.DEFAULT_PROPERTIES, properties);
        }

        // start running the particle emitter
        start (continous = true) {
            if (!Settings.GlobalParticlesEnabled) {
                return;
            }
            
            this.isRunning = true;
            this.continous = continous;
            this.manager.addEmitter(this);
        }

        // stops running the particle emitter
        stop () {
            this.isRunning = false;

            this.clear();

            this.manager.removeEmitter(this);
        }

        // updates the particle emitter
        update (deltaTime) {
            if (!this.isRunning) {
                return;
            }

            const elapsedSinceLast = Date.now() - this.lastEmission;

            if (elapsedSinceLast > this.properties.rate && this.continous) {
                this.emit(this.properties.amount, this.continous);
            }

            if (this.particles.length === 0) {
                if (!this.continous) {
                    // this wont ever emit again
                    // until manually started again
                    this.stop();
                }
                return;
            }

            this.particles.forEach((particle) => {
                particle.update(deltaTime);

                if (particle.isDead()) {
                    this.removeParticle(particle);
                }
            });
        }

        // renders all the particles
        render (context, offset, scale) {
            for (let i = 0; i < this.particles.length; i++) {
                this.particles[i].render(context, offset, scale);
            }
        }

        // spawns the given amount of particles
        emit (amount, continous = false) {
            if (!this.isRunning) {
                this.start(continous);
            }

            for (let i = 0; i < amount; i++) {
                const particle = new Particle(this.properties);

                this.addParticle(particle);
            }

            this.lastEmission = Date.now();
        }

        // clears all particles from the particle emitter
        clear () {
            this.particles = [];
        }

        // adds a particle to the particle emitter
        addParticle (particle) {
            this.particles.push(particle);
        }

        // removes a particle from the particle emitter
        removeParticle (particle) {
            const index = this.particles.indexOf(particle);

            if (index > -1) {
                this.particles.splice(index, 1);
            }
        }

    }
})();  