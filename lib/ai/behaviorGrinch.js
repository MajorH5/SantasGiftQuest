import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Behavior } from './behavior.js';
import { Constants } from '../constants.js';
import { ActionChase } from './actionChase.js';
import { ActionFlee } from './actionFlee.js';

export const BehaviorGrinch = (function () {
    return class BehaviorGrinch extends Behavior {
        static ENTROPY = 0.4;

        constructor (host) {
            super(host);

            this.actionChase = new ActionChase(this.host, BehaviorGrinch.ENTROPY, Constants.TILE_SIZE / 4);
            this.actionFlee = new ActionFlee(this.host);
        }

        update (deltaTime) {
            if (!this.active || !this.host.completedCutscene || this.host.isDead()) {
                return;
            }
            
            const health = this.host.health;
            const maxHealth = this.host.maxHealth;

            if (health / maxHealth > 0.25 || Math.sin(Date.now() * 0.001) > 0.5) {
                // do chase behvior
                this.actionChase.perform(this.getPlayer());
            } else {
                this.actionFlee.perform(this.getPlayer());
            }

        }
    }
})();