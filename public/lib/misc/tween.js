import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Event } from "../PhysicsJS2D/src/event.js";
import { Easing } from "./easing.js";

export const Tween = (function (){
    return class Tween {
        static all = []; // all tweens

        // creates a new tween object
        constructor (duration, tweenData, easing) {
            const tweens = [];

            for (const [start, goal] of tweenData) {
                tweens.push({
                    start: start,
                    value: start,
                    goal: goal
                });
            }

            this.started = new Event();
            this.stopped = new Event();

            this.tweens = tweens;
            this.easing = easing || new Easing();
            this.duration = duration;
            this.lastUpdate = 0;
            this.wasCancelled = false;
            this.resolve = null;
            this.active = false;
            this.elapsed = 0;
            this.paused = false;
        }

        setEasing (easing) {
            this.easing = easing;
        }

        // cancels the tween
        cancel () {
            this.wasCancelled = true;
            this.stop(false);
        }

        // pauses the tween
        pause () {
            this.paused = true;
        }

        // resumes the tween
        resume () {
            this.paused = false;
        }

        // returns true if the tween is paused
        isPaused () {
            return this.paused;
        }

        // returns true if the tween is currently active
        isActive () {
            return this.active;
        }

        // stop the tween
        stop (wasCompleted = true) {
            this.active = false;

            if (this.resolve !== null) {
                this.resolve(wasCompleted);
            }

            this.resolve = null;
            this.handler = null;

            this.stopped.trigger(wasCompleted);
        }

        // runs the tween
        begin (handler) {
            if (this.active) {
                
                console.warn("Tried to run an active tween.");
                return;
            }

            this.active = true;
            this.handler = handler;

            Tween.all.push(this);

            this.started.trigger();

            return new Promise((resolve) => {
                this.resolve = resolve;
            });
        }

        update (deltaTime) {
            this.elapsed += deltaTime;

            if (this.elapsed > this.duration) {
                this.elapsed = this.duration;
            }

            const progress = this.elapsed / this.duration;
            const tweenVal = this.easing.getValue(progress);

            const values = [];

            for (const tween of this.tweens) {
                const start = tween.start;
                const goal = tween.goal;
                const value = tween.value;

                if (typeof value === 'number') {
                    tween.value = start + (goal - start) * tweenVal;
                } else if (value instanceof Vector2) {
                    tween.value = start.add(goal.subtract(start).scale(tweenVal));
                } else {
                    console.error('Unknown tween type.', value);
                }

                values.push(tween.value);
            }

            try {
                this.handler(...values);
            } catch (e) {
                console.error(e);
            }

            if (this.elapsed === this.duration) {
                this.stop(true);
            }
        }

        // steps all the weens that are currently
        // active
        static update (deltaTime) {
            for (let i = 0; i < Tween.all.length; i++) {
                const tween = Tween.all[i]
                
                if (tween.active && !tween.paused) {
                    tween.update(deltaTime);
                } else if (!tween.active) {
                    Tween.all.splice(i, 1);
                    i--;
                }                
            }
        }
    }
})();