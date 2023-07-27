import { SnowballProjectile } from '/lib/world/gameobjects/projectiles/snowballProjectile.js';
import { UIBossHealthBar } from "/lib/ui/features/uiBossHealthBar.js";
import { AnimationPack } from "/lib/sprites/animationPack.js";
import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Animation } from "/lib/sprites/animation.js";
import { Constants } from "/lib/misc/constants.js";
import { Sprite } from "/lib/sprites/sprite.js";
import { Sounds } from "/lib/sounds/sounds.js";
import { Tween } from "/lib/misc/tween.js";
import { Tile } from "/lib/tiles/tile.js";
import { Snowman } from "./snowman.js";
import { Entity } from "../entity.js";

// TODO: Snowman class and snowball projectile class
// move shared animations to snowman class

export const SnowmanBoss = (function () {
    const SNOWMAN_HITBOX = new Vector2(50, 50);
    const SNOWMAN_HITBOX_OFFSET = new Vector2(-5, -10);
    const SNOWMAN_HEALTH = 1500;
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

    return class SnowmanBoss extends Entity {
        constructor (spawnPosition) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: SNOWMAN_HITBOX,
                position: spawnPosition
            }, SNOWMAN_HEALTH);

            this.hitboxOffset = SNOWMAN_HITBOX_OFFSET;
            this.setAnimations(SNOWMAN_ANIMATION_PACK);

            this.zoomSprites = [];
            
            this.decoyTile = new Tile(Tile.SNOWMAN, false, new Vector2(spawnPosition.x, spawnPosition.y));
            this.decoyTile.sprite.flipHorizontal(true);
            
            this.body.position.x += -this.hitboxOffset.x;
            this.body.position.y += -this.hitboxOffset.y;

            this.startedCutscene = false;
            this.cutsceneCompleted = false;
            
            this.bossHealthBar = new UIBossHealthBar('SNOWMAN BOSS', '#555555');
            this.bossHealthBar.setProgress(0);
            
            this.intakeFlameDamage = 2;
            this.squashable = true;
            this.hostile = true;

            this.sprite.flipHorizontal(true);
            this.sprite.setVisible(false);
            
            this.healthBarEnabled = false;

            this.onDamage.listen((damage) => {
                this.bossHealthBar.setProgress(this.health / this.maxHealth);
            });

            this.onDeath.listen(() => {
                Sounds.stopTheme(1);
                Sounds.playTheme(Sounds.SND_SNOWMAN_BOSS_THEME_STINGER, Sounds.MUSIC_DEFAULT_VOLUME, 1, false);

                this.bossHealthBar.setPositionGoal(new Vector2(0.5, -0.2));

                const world = this.world;

                world.score.increment('snowmanFinalBlow');

                this.wait(this.despawnDelay * 2).then(() => {
                    this.bossHealthBar.unparent();
                    world.clearStage(world.stage + 1);
                });
            });

            this.body.gravityScale = 0;

            this.isInForeground = true;
            this.snowmenCount = 0;
            this.isTransitioning = false;
            this.lastSnowballThrow = 0;
            this.damageDoneInForeground = 0;
            this.spawnedSnowmen = false;
        }

        // override damage method
        damage (damage, source) {
            if (this.isTransitioning || !this.isInForeground) {
                return false;
            }

            const successfulDamage = super.damage(damage, source);

            if (!successfulDamage) {
                return false;
            }

            this.damageDoneInForeground += damage;

            return true;
        }

        // throws a projectile towards the given position
        huckSnowball (position) {
            const SNOWBALL_SPEED = 5;
            const world = this.world;

            if (!world) {
                return;
            }

            const delta = position.subtract(this.body.getCenter()).normalize();
            const snowball = new SnowballProjectile(this.body.getCenter(), delta.scale(SNOWBALL_SPEED), this);
            
            world.spawn(snowball);
        }

        // behavior logic for foreground
        behaveForeground () {
            const SNOWBALL_THROW_TRIGGER = 500;
            const SNOWBALL_THROW_RATE = 1 * 1000;
            const MAX_FOREGROUND_DAMAGE = this.maxHealth / 3;

            const player = this.world.player;

            if (!player) {
                return;
            }

            const distance = player.body.getCenter().subtract(this.body.getCenter()).magnitude();
            const timeNow = this.world.elapsedTimeMs;

            if (distance < SNOWBALL_THROW_TRIGGER && timeNow - this.lastSnowballThrow > SNOWBALL_THROW_RATE) {
                this.lastSnowballThrow = timeNow;
                this.huckSnowball(player.body.getCenter());
            }

            if (this.damageDoneInForeground > MAX_FOREGROUND_DAMAGE) {
                this.jumpToBackground();
            }
        }

        // behavior logic for background
        behaveBackground () {
            if (!this.spawnedSnowmen) {
                const tilemap = this.world.tileMap;

                for (let y = 0; y < tilemap.size.y; y++) {
                    for (let x = 0; x < tilemap.size.x; x++) {
                        const tile = tilemap.tiles[y][x];

                        if (!tile) {
                            continue
                        }

                        if (tile.spriteIndex === Tile.SNOWY_SEMISOLID && Math.random() < 0.10) {
                            const snowman = new Snowman(tile.body.position.add(new Vector2(0, -Constants.TILE_SIZE)));

                            this.world.spawn(snowman);

                            this.snowmenCount++;

                            snowman.onDeath.listen(() => {
                                this.snowmenCount--;
                            });
                        }
                    }
                }

                this.spawnedSnowmen = true;
            }

            if (this.snowmenCount === 0) {
                this.jumpToForeground();
            }
        }

        // causes the boss to jump to the background
        async jumpToBackground () {
            this.isTransitioning = true;

            const position = this.body.position;
            const size = this.body.size;

            this.playAnimation(this.animations.JUMP);
            await new Tween(3 * 1000, [[position.y, -size.y]]).begin((y) => {
                this.body.position.y = y;
            });

            await this.grow(0.75, 0.5);
            this.isInForeground = false;
            this.sprite.transparency = 0.35;
            this.renderPriority = Constants.TILE_RENDER_PRIORITY - 1;
            this.body.position.x = this.world.worldSize.x / 2 - this.body.size.x / 2;
            
            const yGoal = (this.world.worldSize.y - Constants.TILE_SIZE * 5) - this.body.size.y;

            await new Tween(3 * 1000, [[this.body.position.y, yGoal]]).begin((y) => {
                this.body.position.y = y;
            });
            this.playAnimation(this.animations.IDLE);

            this.isTransitioning = false;
            this.spawnedSnowmen = false;
        }

        // causes the boss to return to the foreground
        async jumpToForeground () {
            this.isTransitioning = true;
            this.damageDoneInForeground = 0;

            const position = this.body.position;
            const size = this.body.size;

            this.playAnimation(this.animations.JUMP);
            await new Tween(3 * 1000, [[position.y, -size.y]]).begin((y) => {
                this.body.position.y = y;
            });

            await this.grow(1.25, 0.5);
            this.isInForeground = true;
            this.sprite.transparency = 1;
            this.renderPriority = Constants.ENTITY_RENDER_PRIORITY;
            this.body.position.x = this.world.worldSize.x / 2 - this.body.size.x / 2;

            const yGoal = (this.world.worldSize.y - Constants.TILE_SIZE * 5) - this.body.size.y;

            await new Tween(3 * 1000, [[this.body.position.y, yGoal]]).begin((y) => {
                this.body.position.y = y;
            });

            this.playAnimation(this.animations.IDLE);

            this.isTransitioning = false;
        }

        // plays the spawning cutscene animations
        async playSpawnCutscene () {
            const world = this.world;
            const player = world && world.player;
            
            if (!world || !player) {
                if (world && !world.isDemoWorld) {
                    console.warn('No player was found, spawn cutscene aborted.');
                }
                return;
            }
            
            Sounds.stopTheme(2);
            player.lockControls();
            player.motionWalk(1, true);

            await this.walkToSign(player);
            await this.wait(1.5);

            world.track(this);

            await this.wait(0.5);

            for (let i = 0; i < 3; i++) {
                Sounds.playSfx(Sounds.SND_SNOWMAN_BOSS_CHARGE);
                world.camera.shake(2, 0.5);
                await this.zoomSprite(3, 0.5);
                await this.wait(1);
            }

            world.emitParticles(15, {
                size: {
                    start: new Vector2(50, 50),
                    finish: new Vector2(50, 50)
                },
                velocityVariation: new Vector2(20, 20),
                gravity: 1,
                velocity: new Vector2(0, -5),
                position: this.body.getPosition(),
            });
            Sounds.playSfx(Sounds.SND_SNOWMAN_BOSS_BUST);
            this.decoyTile.sprite.setVisible(false);
            this.sprite.setVisible(true);

            this.manuallyAnimated = true;
            this.playAnimation(this.animations.JUMP);
            await this.wait(1);
            this.playAnimation(this.animations.IDLE);
            await this.wait(1);
            this.stopAnimation();
            this.sprite.setRect(new Vector2(12 * 7, 12 * 1), new Vector2(12, 12));

            Sounds.playTheme(Sounds.SND_SNOWMAN_BOSS_THEME);
            world.camera.shake(3, Infinity);

            this.bossHealthBar.setSizeGoal(new Vector2(1, 1));
            this.bossHealthBar.setPositionGoal(new Vector2(0.5, 0.1));

            this.grow(10, 4).then(() => {
                world.camera.stopShake();
                this.cutsceneCompleted = true;
            });
            world.tweenScale(0.5, 4);

            await this.wait(2);

            player.releaseControls();
            world.track(player);
        }

        // causes the boss to start growing largely
        grow (maxSize, duration) {
            const startBodySize = this.body.size,
                goalBodySize = startBodySize.scale(maxSize);
            const startSpriteSize = this.sprite.size,
                goalSpriteSize = startSpriteSize.scale(maxSize);
            const startHitboxOffset = this.hitboxOffset,
                goalHitboxOffset = startHitboxOffset.scale(maxSize);
            
            const startPosition = this.body.position;
            const halfOffset = goalBodySize.scale(0.5).multiply(Vector2.xAxis);
            const startBottom = startPosition.add(new Vector2(0, startBodySize.y));

            const tweenInfo = [
                [startBodySize, goalBodySize],
                [startSpriteSize, goalSpriteSize],
                [startHitboxOffset, goalHitboxOffset],
                [Vector2.zero, halfOffset]
            ];
            
            const growTween = new Tween(duration * 1000, tweenInfo).begin((bodySize, spriteSize, hitboxOffset, offset) => {
                this.body.size = bodySize;
                this.hitboxOffset = hitboxOffset;
                this.sprite.setSize(spriteSize);
                
                this.body.position = startBottom.subtract(new Vector2(0, bodySize.y)).subtract(offset);
            });

            return growTween;
        }

        // creates a duplicate snowman boss sprite
        // and does a zoom effect
        zoomSprite (zoomAmmount, duration) {
            const sprite = new Sprite(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE);
            
            sprite.setRect(this.decoyTile.sprite.imageRectOffset, this.decoyTile.sprite.imageRectSize);
            sprite.flipHorizontal(true);
            
            this.zoomSprites.push(sprite);

            const tweenData = [
                [Constants.TILE_DEFAULT_SIZE, Constants.TILE_DEFAULT_SIZE.scale(zoomAmmount)],
                [1, 0],
            ]

            const zoomTween = new Tween(duration * 1000, tweenData).begin((spriteSize, transparency) => {
                const spritePosition = this.body.getCenter().subtract(spriteSize.scale(0.5));

                sprite.setSize(spriteSize);
                sprite.setTransparency(transparency);
                sprite.setPosition(spritePosition);
            });

            zoomTween.then(() => {
                this.zoomSprites.splice(this.zoomSprites.indexOf(sprite), 1);
            });

            return zoomTween;
        }

        // walks the player until it hits the "Beware of snowman" sign
        walkToSign (player) {
            return new Promise((resolve) => {
                const signCollisionListener = (other) => {
                    const tile = other.getTag('tile');
    
                    if (!tile) {
                        return;
                    }
    
                    const promptText = tile.promptText;
    
                    if (promptText === null && player.body.position.x < 320) {
                        // also have failsafe to stop walking if the player is too far
                        // from possible frame drops
                        return;
                    }
    
                    // hit the initial sign so stop walking
                    player.haltMovement();
                    player.body.collision.unlisten(signCollisionListener);
                    resolve();
                };
                player.body.collision.listen(signCollisionListener);
            })
        }
        
        // fires when the boss despawns
        onDespawn () {
            if (this.world !== null) {
                this.world.uiRoot.removeObject(this.bossHealthBar);
            }

            super.onDespawn();
        }

        // fires when the boss spawns
        // and places the decoy tile in the world
        onSpawn (...args) {
            super.onSpawn(...args);

            // place the decoy tile in the world
            const decoyTilePosition = this.decoyTile.body.position.div(Constants.TILE_SIZE).floor();
            this.world.tileMap.tiles[decoyTilePosition.y][decoyTilePosition.x] = this.decoyTile;

            // parent the ui object 
            if (this.bossHealthBar.parent === null) {
                this.world.uiRoot.addObject(this.bossHealthBar);
            }
        }

        // updates the snoman boss
        update (deltaTime) {
            super.update(deltaTime);

            if (!this.startedCutscene) {
                this.startedCutscene = true;
                this.playSpawnCutscene();
            } else if (this.cutsceneCompleted) {
                if (this.isTransitioning || !this.isAlive) {
                    return;
                }

                if (this.isInForeground) {
                    this.behaveForeground();
                } else {
                    this.behaveBackground();
                }
            }
        }

        // renders the snowman boss
        render (context, offset, scale) {
            super.render(context, offset, scale);

            this.zoomSprites.forEach((sprite) => {
                sprite.render(context, offset, scale);
            });
        }
    }
})();