import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Event } from "../PhysicsJS2D/src/event.js";
import { Sprite } from "./sprite.js";

export const AnimatedSprite = (function () {
    return class AnimatedSprite extends Sprite {
        // creates a new animated sprite object
        constructor (...args) {
            super(...args);

            this.animationComplete = new Event();

            this.isPlaying = false;
            this.animation = null;
            this.fps = 0;
            this.frame = 0;
            this.lastUpdate = -Infinity;
        }

        // updates the current animated sprite's state
        update () {
            if (!this.isPlaying) {
                // animation is not playing
                return;
            }

            let elapsed = (Date.now() - this.lastUpdate) / 1000;

            if (elapsed < this.fps) {
                // too early to render the next frame
                return;
            }

            this.lastUpdate = Date.now();

            // extract current frame information
            let frame = this.animation.frames[this.frame];
            let frameSize = this.animation.size;
            let frameBase = this.animation.base;

            let [xPosition, yPositon] = frame;

            // construct current positioning
            let currentImageOffset = new Vector2(
                xPosition * frameSize.x + frameBase.x,
                yPositon * frameSize.y + frameBase.y
            );
            let currentImageSize = frameSize;

            // update the sprite's texture
            this.setRect(currentImageOffset, currentImageSize);

            this.frame++;

            if (this.frame >= this.animation.frames.length) {
                // animation has finished
                this.animationComplete.trigger(this.animation);

                if (!this.animation.loops){
                    this.stop();
                } else {
                    this.frame = 0;
                }
            }
        }

        // plays the specified animation
        play (animation) {
            if (this.animation === animation) {
                return;
            }

            this.animation = animation;
            this.lastUpdate = -Infinity;
            this.frame = 0;
            this.setFps(animation.fps);

            // immediately update the sprite
            this.update();

            this.isPlaying = true;
        }

        // stops the current animation
        stop () {
            this.isPlaying = false;
        }

        // sets the fps of the current animation
        setFps (fps) {
            this.fps = fps;
        }
    }
})();