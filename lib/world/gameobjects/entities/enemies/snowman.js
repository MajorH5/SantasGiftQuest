import { AnimationPack } from "../../../../sprites/animationPack.js";
import { Vector2 } from "../../../../PhysicsJS2D/src/vector2.js";
import { Animation } from "../../../../sprites/animation.js";
import { Constants } from "../../../../misc/constants.js";
import { Entity } from "../entity.js";

export const Snowman = (function () {
    const SNOWMAN_HITBOX = new Vector2(50, 50);
    const SNOWMAN_HITBOX_OFFSET = new Vector2(-5, -10);
    const SNOWMAN_HEALTH = 100;
    const SNOWMAN_ANIMATION_PACK = new AnimationPack([
        new Animation('WALK')
            .setFrameSize(12, 12)
            .setBase(84, 0)
            .setFrames([[0, 0], [0, 1]]),

        new Animation('JUMP')
            .setFrameSize(12, 12)
            .setBase(84, 0)
            .setFrames([[0, 2]]),

        new Animation('FALL')
            .setFrameSize(12, 12)
            .setBase(84, 0)
            .setFrames([[0, 2]]),

        new Animation('IDLE')
            .setFrameSize(12, 12)
            .setBase(84, 0)
            .setFrames([[0, 0]])
    ]);

    return class Snowman extends Entity {
        constructor (spawnPosition) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: SNOWMAN_HITBOX,
                position: spawnPosition
            }, SNOWMAN_HEALTH);

            this.hitboxOffset = SNOWMAN_HITBOX_OFFSET;
            this.setAnimations(SNOWMAN_ANIMATION_PACK);

            this.body.friction = 0.94;
            this.intakeFlameDamage = 2;
            this.squashable = false;
            this.hostile = true;
            
            this.lastHop = 0;
            this.hopRate = 2 * 1000 + (Math.random() * 1000 * (Math.random() < 0.5 ? -1 : 1));
        }

        hopToPlayer () {
            const player = this.world.player;
            const playerPosition = player.body.getCenter();
            const position = this.body.getCenter();

            const xDirection = Math.sign(playerPosition.x - position.x);

            this.body.velocity = new Vector2(xDirection * 10, -18);
        }

        update (deltaTime) {
            super.update(deltaTime);

            const timeNow = this.world.elapsedTimeMs;

            if (timeNow - this.lastHop > this.hopRate) {
                this.hopToPlayer();
                this.lastHop = timeNow;
            }
        }
    }
})();