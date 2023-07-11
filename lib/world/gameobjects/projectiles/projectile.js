import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Constants } from "/lib/misc/constants.js";
import { GameObject } from "../gameObject.js";

export const Projectile = (function () {
    // class for representing a projectile
    // that does damage to entities and despawns when off screen
    return class Projectile extends GameObject {
        // creates a new projectile
        constructor (spawnPosition, velocity, spriteIndex, damage, speed, fromPlayer, source) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: Constants.TILE_DEFAULT_SIZE,
                position: spawnPosition,
                rotation: Math.atan2(velocity.y, velocity.x) + Math.PI / 2,
                velocity: velocity.scale(speed),
                collidesWith: 'entity',
                boundsConstrained: false,
                resolveCollisions: false,
                ignoreGravity: true
            });

            const spriteX = spriteIndex % 8 * Constants.SPRITE_SIZE.x;
            const spriteY = Math.floor(spriteIndex / 8) * Constants.SPRITE_SIZE.y;

            this.body.setTag('projectile');
            this.sprite.setRect(new Vector2(spriteX, spriteY), Constants.SPRITE_SIZE);
            this.damage = damage;
            this.fromPlayer = fromPlayer;
            this.color = '#ffffff';
            this.soruce = source || null;
        }

        // updates the projcetile
        update (deltaTime) {
            const offset = this.world.camera.getOffset(), scale = this.world.camera.getScale();

            if (this.isVisibleOnScreen(offset, scale) && this.sprite.visible) {
                super.update(deltaTime);
            } else {
                this.despawn();
            }
        }

        // disperses the projectile into a 
        // bunch of particles
        disperse (velocity, color) {
            if (!this.isSpawned) {
                return;
            }
            
            const center = this.body.getCenter();

            this.world.emitParticles(6, {
                color: { start: color, finish: color },
                velocity: velocity,
                position: center
            });

            this.sprite.setVisible(false);
        }

        // called when the projectile collides with something
        onCollision (other) {
            const entity = other.getTag('entity');
            const player = other.getTag('player');
            const tile = other.getTag('tile');

            if (tile && tile.body.solid && !this.fromPlayer) {
                // behaves sort of solid if it's not from the player
                const velocity = this.body.getVelocity().scale(0.7);

                this.disperse(velocity, this.color);
                this.despawn();
                return true;
            }

            if (this.fromPlayer && player) {
                // don't let player hit themselves
                return false;
            }

            if (!entity || entity.isDead() || !this.sprite.visible || entity === this.soruce){
                return false;
            }

            const particleVelocity = entity.body.getVelocity().scale(-0.7);

            entity.damage(this.damage, this);
            this.disperse(particleVelocity, this.color);
            
            return true;
            // TODO: !!IMPORTANT!! FIX
            // despawning gameObject in onCollision function
            // causes mem leak in collisionChunks cache
            // object is NOT cleared from cache lookup map
        }
    }
})();