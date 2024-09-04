import { AnimationPack } from "../../../../sprites/animationPack.js";
import { Vector2 } from "../../../../PhysicsJS2D/src/vector2.js";
import { Animation } from "../../../../sprites/animation.js";
import { Constants } from "../../../../misc/constants.js";
import { Entity } from "../entity.js";
import { Tween } from "../../../../misc/tween.js";
import { Cookie } from "../../collectables/cookie.js";
import { Sounds } from "../../../../sounds/sounds.js";

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
        static COOKIE_CHANCE = 0.125;

        constructor (spawnPosition) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: SNOWMAN_HITBOX,
                position: spawnPosition
            }, SNOWMAN_HEALTH);

            this.hitboxOffset = SNOWMAN_HITBOX_OFFSET;
            this.setAnimations(SNOWMAN_ANIMATION_PACK);
            this.sprite.setTransparency(0);

            this.body.friction = 0.94;
            this.intakeFlameDamage = 2;
            this.squashable = false;
            
            this.isThawing = false;
            this.isFrozen = true;
            this.hostile = false;
            this.despawnDelay = 0;
            
            this.lastHop = 0;
            this.hopRate = 2 * 1000 + (Math.random() * 1000 * (Math.random() < 0.5 ? -1 : 1));

            this.onDeath.listen(() => {
                const world = this.world;

                Sounds.playSfx(Sounds.SND_SNOWMAN_DEATH, Sounds.SFX_DEFAULT_VOLUME * 3);

                world.emitParticles(10, {
                    size: {
                        start: new Vector2(60, 60),
                        finish: new Vector2(40, 40)
                    },
                    gravity: -0.75,
                    velocityVariation: new Vector2(5, 2),
                    position: this.getCenter().subtract(new Vector2(30, 30)),
                });

                if (world === null || Math.random() > Snowman.COOKIE_CHANCE) {
                    return;
                }
                
                const cookie = new Cookie(this.getPosition(), true);
                world.spawn(cookie);

                world.emitParticles(10, {
                    size: {
                        start: new Vector2(10, 10),
                        finish: new Vector2(10, 10)
                    },
                    color: {
                        start: '#A05828',
                        finish: '#CD763C'
                    },
                    velocityVariation: new Vector2(10, 10),
                    position: this.getCenter().subtract(new Vector2(5, 5)),
                });
            })
        }

        hopToPlayer () {
            const player = this.world.player;
            const playerPosition = player.body.getCenter();
            const position = this.body.getCenter();

            const xDirection = Math.sign(playerPosition.x - position.x);

            this.body.velocity = new Vector2(xDirection * 10, -18);
        }

        async thaw () {
            if (this.isThawing || !this.isFrozen) {
                return;
            }

            this.isThawing = true;

            await new Tween(1250, [[0, 1]]).begin((opacity) => {
                this.sprite.setTransparency(opacity);
            });

            this.sprite.setTransparency(1);
            this.isThawing = false;
            this.isFrozen = false;
            this.hostile = true;
        }

        onSpawn (...args) {
            super.onSpawn(...args);
            this.thaw();
            this.world.emitParticles(2 + Math.random() * 3, {
                size: {
                    start: new Vector2(20, 20),
                    finish: new Vector2(0, 0)
                },
                velocityVariation: new Vector2(20, 20),
                gravity: 1,
                position: this.getCenter().subtract(new Vector2(10, 10)),
            });
        }

        update (deltaTime) {
            super.update(deltaTime);

            if (this.isFrozen || this.isDead()) {
                return;
            }

            const timeNow = this.world.elapsedTimeMs;

            if (timeNow - this.lastHop > this.hopRate && this.body.floored) {
                this.hopToPlayer();
                this.lastHop = timeNow;
            }
        }
    }
})();