import { Vector2 } from "./PhysicsJS2D/src/vector2.js";
import { GiftProjectile } from "./giftProjectile.js";
import { Constants } from "./constants.js";
import { Weapon } from "./weapon.js";

export const GiftGun = (function () {
    return class GiftGun extends Weapon {
        static RATE = 250;

        constructor (player) {
            super(player, Constants.TILESET_SPRITE_SHEET, Vector2.zero);
       
            this.elapsedFiring = 0; // start off ready to fire
        }

        emit () {
            const player = this.player;
            const world = player.world;

            if (world === null) {
                return;
            }

            const tileOffset = Constants.TILE_DEFAULT_SIZE.scale(0.5);
            const worldPositionCenter = player.body.getCenter().subtract(tileOffset);
            const gift = new GiftProjectile(worldPositionCenter, player.getMouseDirection());

            world.spawn(gift);
        }

        start () {
            super.start();
            this.emit();
        }

        onFire (deltaTime) {
            this.elapsedFiring += deltaTime;

            if (this.elapsedFiring >= GiftGun.RATE) {
                this.elapsedFiring = 0;
                this.emit();
            }

            super.onFire(deltaTime);
        }
    }
})();