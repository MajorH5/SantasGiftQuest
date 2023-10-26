import { Sounds } from "../../../sounds/sounds.js";
import { Projectile } from "./projectile.js";

export const GiftProjectile = (function () {
    const GIFT_DAMAGE = 10;
    const GIFT_SPEED = 15;

    return class GiftProjectile extends Projectile {
        // creates a new gift projectile
        constructor (spawnPosition, velocity) {
            let giftType = 40 + Math.floor(Math.random() * 3);
            super(spawnPosition, velocity, giftType, GIFT_DAMAGE, GIFT_SPEED, true);
            
            this.giftType = giftType;
            this.color = (this.giftType === 40 && '#da501d') ||
                (this.giftType === 41 && '#51c61a') ||
                (this.giftType === 42 && '#d1e217');
        }

        onCollision (other) {
            const successfulImpact = super.onCollision(other);
            
            if (successfulImpact) {
                Sounds.playSfx(Sounds.SND_PROJECTILE_HIT, Sounds.SFX_DEFAULT_VOLUME);
            }
        }
    }
})();