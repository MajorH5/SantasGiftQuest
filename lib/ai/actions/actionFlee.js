import { Behavior } from "../behaviors/behavior.js";
import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Constants } from "../../misc/constants.js";

export const ActionFlee = (function () {
    return class ActionFlee extends Behavior {
        constructor (host) {
            super(host);
            this.escapingEdge = -Infinity;
        }

        getAway (target) {
            const targetCenter = target.body.getCenter();
            const hostCenter = this.host.body.getCenter();

            const xDistance = targetCenter.x - hostCenter.x;
            
            const absDistance = Math.abs(xDistance);
            const directionToPlayer = Math.sign(xDistance);

            const currentDirection = this.host.walkingDirection;

            const worldSize = this.getWorld().worldSize;
                
            const distToLeftEdge = hostCenter.x;
            const distToRightEdge = worldSize.x - hostCenter.x;
                
            if (Math.abs(distToLeftEdge) <= Constants.TILE_SIZE * 2) {
                this.host.motionWalk(1);
                this.escapingEdge = Date.now();
            } else if (Math.abs(distToRightEdge) <= Constants.TILE_SIZE * 2) {
                this.host.motionWalk(-1);
                this.escapingEdge = Date.now();
            } else if (currentDirection === directionToPlayer && Date.now() - this.escapingEdge > 500 && Math.random() < 0.049) {
                this.host.motionWalk(-directionToPlayer);
                this.escapingEdge = -Infinity;
            } else if (currentDirection === 0) {
                this.host.motionWalk(Math.random() < 0.5 ? -1 : 1);
            }
        }

        perform (target) {
            this.getAway(target);
        }
    }
})();