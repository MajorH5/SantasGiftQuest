import { AIBehavior } from "./AIBehavior.js";

export const NPCBehavior = (function () {
    return class NPCBehavior extends AIBehavior {
        constructor (entity, world) {
            super(entity, world);

            this.registerState("CHASE", new AIState("CHASE"));
            this.registerState("FLEE", new AIState("FLEE"));

            this.setState("CHASE");
        }

        update (deltaTime) {
            this.state.update(deltaTime);
        }
    }
})();