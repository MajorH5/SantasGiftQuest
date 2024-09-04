import { Constants } from "../../misc/constants.js";
import { AIState } from "./AIState.js";

export const ChaseState = (function () {
    return class ChaseState extends AIState {
        static RUN_HOST = 'RUN_HOST';
        static LEDGE_JUMP = 'LEDGE_JUMP';

        constructor (host, target, world, config) {
            super(host, target, world, config);

            this.ledge = null;
            this.searching = false;
            this.jumpNecesary = false;
            this.ledgeRuningStart = false;

            this.chaseReleaseDistance = config || Constants.TILE_SIZE * 3;
            this.directionSwitchChance = config.directionSwitchChance || 0.1;
        }

        determineCurrentAction (host, target, deltaTime) {
            const hostPosition = host.getCenter();
            const targetPosition = target.getCenter();

            const distance = hostPosition.subtract(targetPosition).magnitude();

            if (distance > this.chaseReleaseDistance) {
                this.setCurrentAction(AIState.NONE);
                return;
            }

            if (this.canRunToHost(host, target)) {
                this.runToHost(host, target);
            }

        }

        canRunToHost (host, target) {
            // cast rays downward to get the floor tile
            // underneath them
            const hostStandable = this.getSolidOrSemiSolidUnderneath(host);
            const targetStandable = this.getSolidOrSemiSolidUnderneath(target);

            if (hostStandable !== null && targetStandable !== null) {
                const onSameYLevel = hostStandable.position.y === targetStandable.position.y;

                if (onSameYLevel) {
                    // should be a straight shot to the target
                    // any pits in the way will be handled by the run function
                    return true;
                }
            }

            return false;
        }

        runToHost (host, target) {
            // trys to chase a target by running towards them

            const hostPosition = host.getCenter();
            const targetPosition = target.getCenter();

            const direction = targetPosition.subtract(hostPosition).normalize();
            const isChange = host.walkingDirection !== direction.x;
            
            if (isChange && this.getEntropyChance(this.directionSwitchChance)) {
                return;
            }

            if (direction.x < 0) {
                host.motionWalk(-1);
            } else if (direction > 0) {
                host.motionWalk(1);
            }

            this.setCurrentAction(ChaseState.RUN_HOST);
        }

        update (deltaTime) {
            super.update(deltaTime);

            const target = this.getTarget();
            const host = this.getHost();

            if (target === null || host === null) {
                // nothing to chase after
                return;
            }

            this.determineCurrentAction(host, target, deltaTime);
        }

    }
})();