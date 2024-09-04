export const AIBehavior = (function () {
    return class AIBehavior {
        constructor (entity, world) {
            this.state = null;
            this.states = {};

            this.entity = entity;

            this.physics = world.physics;
            this.player = world.player;
            this.world = world;
        }

        update (deltaTime) {

        }

        registerState (alias, state) {
            this.states[alias] = state;
        }

        getState () {
            return this.state;
        }

        setState (alias) {
            const state = this.states[alias];

            if (state === undefined) {
                throw new Error(`AIBehavior.setState(): Invalid state alias "${alias}".`);
            }

            this.state = state;
        }
    }
})();