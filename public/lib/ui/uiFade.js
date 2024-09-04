import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { UIBase } from "./uiBase.js";

export const UIFade = (function () {
    return class UIFade extends UIBase {
        // creates a new uiFade object
        constructor (color) {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: color || '#ffffff',
                backgroundEnabled: true,
                transparency: 0,
                zIndex: Infinity
            });

            this.isTransitioning = false;
            this.transitionTime = 0;
            this.transitionDuration = 1000;
            this.transitionGoal = 0;
        }

        // updaes the uiFade object
        update (deltaTime) {
            super.update(deltaTime);
            this.updateFade();
        }

        // fades the screen in or out
        async fadeTo (goal, duration) {
            this.isTransitioning = true;
            this.transitionTime = Date.now();
            this.transitionDuration = duration;
            this.transitionGoal = goal;

            return new Promise((resolve) => {
                const onUpdate = () => {
                if (this.transitionGoal !== goal || this.transparency === goal || !this.isTransitioning) {
                        resolve();
                        this.onUpdate.unlisten(onUpdate);
                    }
                };

                this.onUpdate.listen(onUpdate)
            });
        }

        // sets the fade to a specific value
        setFade (value) {
            this.isTransitioning = false;
            this.transitionTime = 0;
            this.transitionDuration = 0;
            this.transitionGoal = 0;
            this.transparency = value;
        }

        // updates the fade
        updateFade () {
            if (this.isTransitioning) {
                const elapsed = Date.now() - this.transitionTime;
                let progress = elapsed / this.transitionDuration;

                let stopEarly = this.transitionGoal === 0 && this.transparency <= 0.09;

                if (progress >= 1 || stopEarly) {
                    this.isTransitioning = false;
                    progress = 1;
                }
                
                const current = this.transparency;

                // lerp
                this.transparency = current + (this.transitionGoal - current) * progress;
            }
        }
    }
})();