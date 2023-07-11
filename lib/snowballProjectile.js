import { Vector2 } from "./PhysicsJS2D/src/vector2.js";
import { Sounds } from "./sounds.js";
import { Projectile } from "./projectile.js";

export const SnowballProjectile = (function () {
    const SNOWBALL_DAMAGE = 10;
    const SNOWBALL_SPEED = 15;

    return class SnowballProjectile extends Projectile {
        static SPRITE = 47;
        constructor (spawnPosition, velocity, source) {
            super(spawnPosition, velocity, SnowballProjectile.SPRITE,
                    SNOWBALL_DAMAGE, SNOWBALL_SPEED, false, source);
        }

        onCollision (other) {
            super.onCollision(other);
        }
    }
})();