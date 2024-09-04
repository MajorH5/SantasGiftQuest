import { UIBossHealthBar } from '../../../../ui/features/uiBossHealthBar.js';
import { BehaviorGrinch } from '../../../../ai/behaviors/behaviorGrinch.js';
import { AnimationPack } from '../../../../sprites/animationPack.js';
import { Vector2 } from '../../../../PhysicsJS2D/src/vector2.js';
import { Animation } from '../../../../sprites/animation.js';
import { Constants } from '../../../../misc/constants.js';
import { Sounds } from '../../../../sounds/sounds.js';
import { Camera } from '../../../../world/camera.js';
import { Entity } from '../entity.js';
import { Penguin } from './penguin.js';

export const Grinch = (function () {
    const GRINCH_HITBOX = new Vector2(30, 45);
    const GRINCH_HITBOX_OFFSET = new Vector2(-20, -15);
    const GRINCH_HEALTH = 1000;
    const GRINCH_ANIMATION_PACK = new AnimationPack([
        new Animation('WALK')
            .setFrameSize(12, 12)
            .setBase(72, 0)
            .setFrames([[0, 0], [0, 1]]),

        new Animation('JUMP')
            .setFrameSize(12, 12)
            .setBase(72, 0)
            .setFrames([[0, 2]]),

        new Animation('FALL')
            .setFrameSize(12, 12)
            .setBase(72, 0)
            .setFrames([[0, 2]]),

        new Animation('IDLE')
            .setFrameSize(12, 12)
            .setBase(72, 0)
            .setFrames([[0, 0]])
    ]);
    
    return class Grinch extends Entity {
        // creates a new grinch boss
        constructor () {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, { size: GRINCH_HITBOX }, GRINCH_HEALTH);

            this.hitboxOffset = GRINCH_HITBOX_OFFSET;
            this.setAnimations(GRINCH_ANIMATION_PACK);

            this.startedCutscene = false;
            this.completedCutscene = false;
            
            this.cutsceneStartDelay = 3;
            this.stageEndDelay = 7;
            this.escapingEdge = -Infinity;

            this.bossHealthBar = new UIBossHealthBar('THE GRINCH', '#2a6a46');
            this.bossHealthBar.setProgress(0);

            this.acceleration = 2.3;
            this.maxSpeed = 8;
            this.baseSpeed = 5;
            this.jumpPower = 18;
            this.squishDamage = 6;
            this.baseDamage = 17;
            
            // prepare for cutscene
            this.sprite.hide();
            this.body.anchor();

            // this.setBehavior(new BehaviorGrinch(this));

            this.squashable = true;
            this.hostile = true;
            this.healthBarEnabled = false;

            this.onDamage.listen((damage) => {
                this.bossHealthBar.setProgress(this.health / this.maxHealth);
            });

            this.onDeath.listen(() => {
                Sounds.stopTheme(1);
                Sounds.playTheme(Sounds.SND_GRINCH_BOSS_THEME_STINGER, Sounds.MUSIC_DEFAULT_VOLUME, 1, false);
                
                this.bossHealthBar.setPositionGoal(new Vector2(0.5, -0.2));

                const world = this.world;
                const penguins = world.gameObjectManager.getGameObjectsByType(Penguin);

                world.score.increment('grinchFinalBlow');

                for (const penguin of penguins) {
                    penguin.damage(Infinity, null);
                }

                world.wait(this.despawnDelay * 2).then(() => {
                    this.bossHealthBar.unparent();
                    world.clearStage(world.stage + 1);
                });
            });
        }

        // flings out a penguin in the direction of the player
        flingPenguin () {
            const bodyCenter = this.body.getCenter();
            const playerCenter = this.world.player.body.getCenter();
            
            const launchDirection = Math.sign(playerCenter.x - bodyCenter.x);
            const launchVelocity = new Vector2(launchDirection * 20, 
                -Math.random() * 8);

            const penguin = new Penguin(new Vector2(bodyCenter.x, bodyCenter.y - Constants.TILE_SIZE / 2), false);
            penguin.body.angularVelocity = (Math.random() - 0.5) * 2 * 5;
            penguin.body.velocity = launchVelocity;
            this.world.spawn(penguin);
        }

        // grinch flee ai code
        behaveFlee (deltaTime) {
            const player = this.world.player;

            const playerCenter = player.body.getCenter();
            const grinchCenter = this.body.getCenter();

            const xDistance = playerCenter.x - grinchCenter.x;
            
            const absDistance = Math.abs(xDistance);
            const directionToPlayer = Math.sign(xDistance);

            const currentDirection = this.walkingDirection;

            const worldSize = this.world.worldSize;
                
            const distToLeftEdge = grinchCenter.x;
            const distToRightEdge = worldSize.x - grinchCenter.x;
                
            if (Math.abs(distToLeftEdge) <= Constants.TILE_SIZE * 2) {
                this.motionWalk(1);
                this.escapingEdge = this.getElapsedTime();
            } else if (Math.abs(distToRightEdge) <= Constants.TILE_SIZE * 2) {
                this.motionWalk(-1);
                this.escapingEdge = this.getElapsedTime();
            } else if (currentDirection === directionToPlayer && this.getElapsedTime() - this.escapingEdge > 500 && Math.random() < 0.049) {
                this.motionWalk(-directionToPlayer);
                this.escapingEdge = -Infinity;
            } else if (currentDirection === 0) {
                this.motionWalk(Math.random() < 0.5 ? -1 : 1);
            }
        }

        // grinch main ai code
        behaveChase (deltaTime) {
            const JUMP_TRIGGER_DISTANCE = Constants.TILE_SIZE * 2;
            const JUMP_CHANCE = 0.08;
            const MAX_TIME_BEHIND_PLAYER = 1000;

            const PENGUIN_CHANCE = 0.015;
            const PENGUIN_MAX = 5;

            const player = this.world.player;

            const playerCenter = player.body.getCenter();
            const grinchCenter = this.body.getCenter();

            const xDistance = playerCenter.x - grinchCenter.x;
            
            const absDistance = Math.abs(xDistance);
            const directionToPlayer = Math.sign(xDistance);

            const currentDirection = this.walkingDirection;

            const playerIsAbove = playerCenter.y < grinchCenter.y;

            if (currentDirection !== directionToPlayer) {
                if (this.timeElapsedBehindPlayer > MAX_TIME_BEHIND_PLAYER || Math.random() < 0.08) {
                    this.motionWalk(directionToPlayer);
                } else {
                    this.timeElapsedBehindPlayer += deltaTime;
                }
            } else {
                this.timeElapsedBehindPlayer = 0;
            }

            if (absDistance <= JUMP_TRIGGER_DISTANCE && playerIsAbove && Math.random() < JUMP_CHANCE) {
                this.motionJump();
            }

            const totalSpawnedPenguins = this.world.gameObjectManager.getGameObjectsByType(Penguin).length;

            if (
                Math.random() < PENGUIN_CHANCE &&
                totalSpawnedPenguins < PENGUIN_MAX &&
                !this.body.floored
            ) {
                this.flingPenguin();
            }
        }

        // plays the spawn cutscene
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
            world.setScale(0.55);
            
            this.wait(1).then(() => {
                player.haltMovement();
            });
            
            await this.wait(this.cutsceneStartDelay);

            const grinch = this;

            // set grinch position and drop him in from
            // the top of the screen
            grinch.setPosition(new Vector2(world.worldSize.x / 2, -Constants.TILE_SIZE * 2));
            grinch.sprite.show();
            grinch.body.unanchor();
            grinch.sprite.flipHorizontal(true);
            world.track(grinch);

            // wait for grinch to land
            await new Promise ((resolve) => {
                let landListener = () => {
                    Sounds.playSfx(Sounds.SND_EXPLOSION, Sounds.SFX_DEFAULT_VOLUME);

                    const position = this.body.getPosition();
                    const size = this.body.getSize();

                    this.world.emitParticles(40, {
                        size: {
                            start: new Vector2(40, 40),
                            finish: new Vector2(0, 0),
                        },
                        velocity: new Vector2(0, -1),
                        velocityVariation: new Vector2(20, 5),
                        position: new Vector2(position.x + size.x / 2, position.y + size.y / 2),
                    });

                    world.camera.shake(10, 0.35);

                    grinch.onLand.unlisten(landListener);
                    resolve();
                }
    
                grinch.onLand.listen(landListener);
            });

            // bring down the health bar
            this.bossHealthBar.setSizeGoal(new Vector2(1, 1));
            this.bossHealthBar.setPositionGoal(new Vector2(0.5, 0.1));

            // briefly pause
            await this.wait(1.50);
            
            // play the boss theme and reinstate
            // the camera and player controls
            Sounds.playTheme(Sounds.SND_GRINCH_BOSS_THEME, Sounds.MUSIC_DEFAULT_VOLUME);
            world.tweenScale(Camera.DEFAULT_SCALE, 2);
            world.track(player)
            player.releaseControls();
            player.giftGun.enable();

            // give time for the player to move
            await this.wait(0.50);

            // enable ai code path
            this.completedCutscene = true;
        }

        // updates the boss and performs AI
        update (deltaTime) {
            super.update(deltaTime);

            if (!this.startedCutscene) {
                this.startedCutscene = true;
                this.playSpawnCutscene();
            }
            
            if (this.completedCutscene && !this.isDead()) {
                if (this.health / this.maxHealth > 0.25 || Math.sin(this.getElapsedTime() * 0.001) > 0.5) {
                    this.behaveChase(deltaTime);
                } else {
                    this.behaveFlee(deltaTime);
                }
            }
        }

        // fires when the boss despawns
        onDespawn () {
            if (this.world !== null) {
                this.world.uiRoot.removeObject(this.bossHealthBar);
            }

            super.onDespawn();
        }

        // fires when the grinch spawns in the world
        onSpawn (...args) {
            super.onSpawn(...args);

            if (this.bossHealthBar.parent === null) {
                this.world.uiRoot.addObject(this.bossHealthBar);
            }
        }
    }
})();