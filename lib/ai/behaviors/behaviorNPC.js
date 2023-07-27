import { Vector2 } from '../../PhysicsJS2D/src/vector2.js';
import { Behavior } from './behavior.js';
import { Constants } from '../../misc/constants.js';
import { ActionChase } from '../actions/actionChase.js';

export const BehaviorNPC = (function () {
    return class BehaviorNPC extends Behavior {
        static ENTROPY = 0.1;

        constructor (host) {
            super(host);
            this.actionChase = new ActionChase(this.host, BehaviorNPC.ENTROPY, Constants.TILE_SIZE);
        }

        update (deltaTime) {
            if (!this.active) {
                return;
            }
            
            this.actionChase.perform(this.getPlayer());
        }
    }
})();