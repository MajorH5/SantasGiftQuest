import { Vector2 } from "../../../PhysicsJS2D/src/vector2.js";
import { Projectile } from "./projectile.js";

export const SnowballProjectile = (function () {
    return class SnowballProjectile extends Projectile {
        static SNOWBALL_DAMAGE = 10;
        static SNOWBALL_SPEED = 8;
        static SNOWBALL_SCALE = 2;
        static SPRITE = 47;

        constructor (spawnPosition, velocity, source) {
            super(
                spawnPosition, velocity,
                SnowballProjectile.SPRITE,
                SnowballProjectile.SNOWBALL_DAMAGE,
                SnowballProjectile.SNOWBALL_SPEED,
                false, source);

                const scaledSize = this.body.size.scale(SnowballProjectile.SNOWBALL_SCALE);

                // this.body.size = this.body.size.scale(SnowballProjectile.SNOWBALL_SCALE);
                this.sprite.setSize(scaledSize);
                this.hitboxOffset = this.body.size.scale(-0.5);
                this.body.position = this.body.position.subtract(this.body.size.scale(0.5));
                this.body.angularVelocity = (5 + Math.random() * 5 )* (Math.random() < 0.5 ? -1 : 1)
        }

        onCollision (other) {
            super.onCollision(other);
        }
    }
})();