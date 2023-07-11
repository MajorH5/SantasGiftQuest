import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";

export const Tween = (function (){
    return class Tween {
        static all = []; // all tweens

        // creates a new tween object
        constructor (duration, tweenData) {
            const tweens = [];

            for (const [start, goal] of tweenData) {
                tweens.push({
                    start: start,
                    value: start,
                    goal: goal
                });
            }

            this.tweens = tweens;
            this.duration = duration;
            this.lastUpdate = 0;
            this.wasCancelled = false;
            this.resolve = null;
            this.active = true;
            this.elapsed = 0;
        }

        // cancels the tween
        cancel () {
            this.wasCancelled = true;
            this.stop();
        }

        // stop the tween
        stop () {
            this.active = false;

            if (this.resolve !== null) {
                this.resolve();
            }

            this.resolve = null;
            this.handler = null;
        }

        // runs the tween
        begin (handler) {
            this.active = true;
            this.handler = handler;

            Tween.all.push(this);

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
            const values = [];

            for (const tween of this.tweens) {
                const start = tween.start;
                const goal = tween.goal;
                const value = tween.value;

                if (typeof value === 'number') {
                    tween.value = start + (goal - start) * progress;
                } else if (value instanceof Vector2) {
                    tween.value = start.add(goal.subtract(start).scale(progress));
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
                this.stop();
            }
        }

        // steps all the weens that are currently
        // active
        static update (deltaTime) {
            for (let i = 0; i < Tween.all.length; i++) {
                const tween = Tween.all[i]
                
                tween.update(deltaTime);

                if (!tween.active) {
                    Tween.all.splice(i, 1);
                    i--;
                }
            }
        }
    }
})();