import { Vector2 } from "./PhysicsJS2D/src/vector2.js";

export const Animation = (function () {
    return class Animation {
        static DEFAULT_FRAME_RATE = 1 / 5;

        // creates a new animation object
        constructor (name) {
            this.name = name;
            this.base = new Vector2(0, 0);
            this.size = new Vector2(0, 0);
            this.fps = Animation.DEFAULT_FRAME_RATE;
            this.frames = [];
            this.forced = false;
            this.loops = true;
        }

        // clones and returns the animation
        clone () {
            let anim = new Animation(this.name);

            anim.setBase(this.base.x, this.base.y);
            anim.setFrameRate(this.fps);
            anim.setFrameSize(this.size.x, this.size.y);
            anim.setLoops(this.loops);
            anim.setFrames(this.frames);
            anim.setForced(this.forced);

            return anim;
        }

        // sets whether the animation
        // repeats indefinitely, or once
        setLoops (loops) {
            this.loops = loops;
            return this;
        }

        // sets the name for identifying the animation
        setName (name) {
            this.name = name;
            return this;
        }

        // sets the offset into the image of which
        // to start the animation. frame [0, 0] == x, y
        setBase (x, y) {
            this.base = new Vector2(x, y);
            return this;
        }
        
        // sets the frame rate of the animation
        setFrameRate (fps) {
            this.fps = fps;
            return this;
        }
        
        // sets size of the rect within the image
        // to draw for each frame
        setFrameSize (width, height) {
            this.size = new Vector2(width, height);
            return this;
        }
        
        // sets the frames of animations stored as [x, y]
        // each coord is multiplied into the frame size
        setFrames (frames) {
            this.frames = frames;
            return this;
        }

        // sets whether this animation should be forced,
        // meaning it cannot be interrupted by standard animations
        setForced (forced) {
            this.forced = forced;
            return this;
        }
    }
})();