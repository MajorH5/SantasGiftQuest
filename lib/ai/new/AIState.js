import { Vector2 } from "../../PhysicsJS2D/src/vector2";
import { Ray } from "../../PhysicsJS2D/src/ray.js";
import { Settings } from "../../misc/settings.js";

export const AIState = (function () {
    return class AIState {
        static NONE = "NONE";
        
        constructor (host, target, world, config) {
            this.host = host;
            this.target = target;
            this.world = world;
            this.action = AIState.NONE;
            this.entropy = config.entropy || 1;
            this.debug = {};
        }

        update (deltaTime) {
            // clear the debug information
            this.debug = {};
        }

        render (context, offset, scale) {
            // renders the state's debug information
            // to the screen

            if (!Settings.DebugModeEnabled) {
                return;
            }

            const host = this.getHost();

            if (host !== null) {
                const position = host.getPosition();
                const size = host.getSize();

                context.fillStyle = 'black';
                context.fillText(this.action, position.x, position.y + size.y);
            }
        }

        getHost () {
            return this.host;
        }

        getTarget () {
            return this.target;
        }

        setCurrentAction (action) {
            // sets the action the AI is currently
            // performing
            this.action = action;
        }

        getEntropyChance (likelihood, offset = 1) {
            // returns true if a random number between 0 and 1
            // is less than the likelihood
            return Math.random() * this.entropy * offset < likelihood;
        }

        getSolidOrSemiSolidUnderneath (entity) {
            // casts a ray downward from the entity's center
            // and returns the first solid or semi-solid tile
            // it hits

            const position = entity.getCenter();
            const ray = new Ray(position, Vector2.yAxis.scale(Ray.MAX_DISTANCE));

            ray.setFilter((body) => {
                // avoid collisions with self and non-standables
                return body !== entity && 
                    body.solid || body.semiSolid;
            });

            const result = this.world.physics.raycast(ray);

            if (result.hit !== null) {
                return result.hit;
            }

            return null;
        }
    }
})();