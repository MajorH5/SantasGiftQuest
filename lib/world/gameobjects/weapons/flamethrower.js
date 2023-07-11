import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Constants } from "/lib/misc/constants.js";
import { Entity } from "../entities/entity.js";
import { Sounds } from "/lib/sounds/sounds.js";
import { Weapon } from "./weapon.js";

export const Flamethrower = (function () {
    return class Flamethrower extends Weapon {
        static MELT_DISTANCE_MAX = Constants.TILE_SIZE * 5;
        static DAMAGE_DIST_MAX = Constants.TILE_SIZE * 5;
        static FLAME_SPEED = 15;

        // attaches a flamethrower to the given player
        constructor (player) {
            super(player, Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE);

            this.emitter = null;
            this.sprite.setRect(new Vector2(6 * Constants.SPRITE_SIZE.x, 5 * Constants.SPRITE_SIZE.y),
                Constants.SPRITE_SIZE);
        }

        // stops the flamethrower
        stop () {
            super.stop();

            if (this.emitter !== null) {
                this.emitter.continous = false;
            }
        }

        onFire (deltaTime) {
            super.onFire(deltaTime);

            const player = this.player;
            const world = player.world;

            if (world === null || this.emitter === null) {
                return;
            }

            const velocity = player.getMouseDirection();
            const position = this.getFlameEmitPosition();

            this.emitter.properties.velocity = velocity.scale(Flamethrower.FLAME_SPEED);
            this.emitter.properties.position = position;

            if (this.framesElapsed % 3 === 0) {
                Sounds.playSfx(Sounds.SND_FLAME, Sounds.SFX_DEFAULT_VOLUME / 3, 1 + Math.random() * 0.6);
            }

            // melt snow & damage enemies
            this.meltSnowInDirection(velocity);
            this.damageEnemiesInDirection(velocity);
        }

        // fires the flamethrower
        start () {
            super.start();

            const player = this.player;
            const world = player.world;

            if (world === null) {
                return;
            }

            this.emitter = world.createEmitter({
                color: {
                    start: '#f59131',
                    finish: '#ff0000',
                },
                rate: (1 / 20) * 1000,
                amount: 10,
                lifetime: 0.65 * 1000,
                gravity: -0.5,
                position: this.getFlameEmitPosition(),
                velocity: player.getMouseDirection().scale(Flamethrower.FLAME_SPEED)
            });
            this.emitter.start();
        }

        // damages enemies in the given direction
        damageEnemiesInDirection (direction, damage) {
            const player = this.player;
            const world = player.world;

            if (world === null) {
                return;
            }

            const gameObjectManager = world.gameObjectManager;
            const entities = gameObjectManager.getGameObjectsByType(Entity);

            entities.forEach((entity) => {
                if (entity === player || !entity.hostile) { return; }

                const playerCenter = player.body.getCenter();
                const entityCenter = entity.body.getCenter();

                const entitySize = entity.body.getSize();
                const distance = playerCenter.subtract(entityCenter);
                const playerToEntity = distance.normalize();

                let angle = Math.acos(playerToEntity.dot(direction));

                if (distance.magnitude() > Flamethrower.DAMAGE_DIST_MAX + entitySize.x / 2) { return; }
                if (angle < Math.PI / 1.4) { return;  }

                entity.damage(entity.intakeFlameDamage, player);
            });
        }

        // melts snow near the player that is
        // in the given unit vector direction
        meltSnowInDirection (direction) {
            const player = this.player;
            const world = player.world;
            const tileMap = world ? world.tileMap : null;

            if (world === null || tileMap === null) {
                return;
            }

            tileMap.snowTiles.forEach((tile) => {
                const playerCenter = player.body.getCenter();
                const tileCenter = tile.body.getCenter();

                const distance = playerCenter.subtract(tileCenter);
                const playerToTile = distance.normalize();

                let angle = Math.acos(playerToTile.dot(direction));

                if (distance.magnitude() > Flamethrower.MELT_DISTANCE_MAX) { return; }
                if (angle < Math.PI / 1.4) { return;  }
                
                const melted = tile.melt();

                if (melted) {
                    world.deleteTile(tile.localPosition.x, tile.localPosition.y);
                    world.score.increment('snowMelted');
                }
            });
        }

        // returns the position the flames should
        // emit from
        getFlameEmitPosition () {
            const player = this.player;
            const animations = player.animations;
            const playerSprite = player.sprite;

            const currentAnimation = player.currentAnimation;
            const position = player.body.getCenter();

            if (currentAnimation === animations.JUMP || currentAnimation === animations.FALL) {
                if (!playerSprite.isFlippedHorizontal) {
                    position.x -= 45;
                }
                position.y -= 45;
            } else {
                if (playerSprite.isFlippedHorizontal) {
                    position.x -= 45;
                }
                position.y -= 10;
            }

            return position;
        }

        // draws the flamethrower with the
        // appropriate offsets
        render (context, offset, scale) {
            const DEFAULT_OFFSET = new Vector2(-10, -15);
            const FALL_JUMP_OFFSET = new Vector2(-45, -10);

            const player = this.player;
            const playerSprite = this.player.sprite;
            
            if (playerSprite.isFlippedHorizontal) {
                FALL_JUMP_OFFSET.x = 25;
            }

            if (player.currentAnimation === player.animations.JUMP || player.currentAnimation === player.animations.FALL) {
                this.sprite.setRotation(Math.PI / 2);
                this.sprite.flipHorizontal(true);
                this.sprite.flipVertical(!playerSprite.isFlippedHorizontal)
                offset = offset.add(FALL_JUMP_OFFSET);
            } else {
                this.sprite.setRotation(0);
                offset = offset.add(DEFAULT_OFFSET);
            }

            super.render(context, offset, scale);
        }
    }
})();