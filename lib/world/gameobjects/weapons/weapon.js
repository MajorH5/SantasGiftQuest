import { Constants } from "../../../misc/constants.js";
import { GameObject } from "../gameObject.js";

export const Weapon = (function () {
    return class Weapon extends GameObject {
        static CROSSHAIR_OPEN = new Image();
        static CROSSHAIR_CLOSED = new Image();
        
        static {
            Weapon.CROSSHAIR_OPEN.src = Constants.ORIGIN + '/assets/images/crosshair_open.png';
            Weapon.CROSSHAIR_CLOSED.src = Constants.ORIGIN + '/assets/images/crosshair_closed.png';
        }

        static totalEnabled = 0;
    
        // base class for a firable player
        // attached weapon object
        constructor (player, sprite, size) {
            super(sprite, size);

            this.player = player;
            this.active = false;
            this.isFiring = false;
            this.framesElapsed = 0; // number of frames elapsed while firing
        }

        enable () {
            this.active = true;
            Weapon.totalEnabled++;
            this.setCursor(Weapon.CROSSHAIR_OPEN);
        }

        disable () {
            this.active = false;
            this.stop();
            Weapon.totalEnabled--;

            if (Weapon.totalEnabled <= 0) {
                Weapon.totalEnabled = 0;
                this.setCursor(null);
            }
        }

        isActive () {
            return this.active;
        }

        firing () {
            return this.isFiring;
        }

        onFire (deltaTime) {
            // will be overridden by subclasses
            this.flamesElapsed++;
        }

        start () {
            this.isFiring = true;
            this.setCursor(Weapon.CROSSHAIR_CLOSED);
        }

        stop () {
            this.isFiring = false;
            this.framesElapsed = 0;
            
            if (this.active) {
                this.setCursor(Weapon.CROSSHAIR_OPEN);
            }
        }

        setCursor (cursor) {
            const world = this.player.world;

            if (world === null || !this.player.usingInput) {
                return;
            }

            world.setCursor(cursor);
        }

        update (deltaTime) {
            const player = this.player;

            // move to player's position
            this.setPosition(player.body.getPosition());
            this.sprite.flipHorizontal(player.sprite.isFlippedHorizontal);
            this.sprite.flipVertical(player.sprite.isFlippedVertical);

            // update firing logic
            if (this.isFiring) {
                this.onFire(deltaTime);
            }

            super.update(deltaTime);
        }
    }
})();