// class for compiling and managing batches
// of animations
export const AnimationPack = (function () {
    return class AnimationPack {
        constructor (animations) {
            this.animations = animations;

            // set animation names to corresponding animation
            // for easy lookup
            for (let i = 0; i < this.animations.length; i++) {
                this[this.animations[i].name] = this.animations[i];
            }
        }

        // returns all associated animations with this pack
        getAnimations () {
            return this.animations;
        }
    }
})();