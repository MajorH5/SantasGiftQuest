import { Vector2 } from "./PhysicsJS2D/src/vector2.js";
import { AnimationPack } from "./animationPack.js";
import { Flamethrower } from "./flamethrower.js";
import { Sounds } from '/public/lib/sounds.js';
import { GiftGun } from "./giftGun.js";
import { Constants } from "./constants.js";
import { Animation } from "./animation.js";
import { Entity } from "./entity.js";
import { Tile } from "./tile.js";

export const Player = (function () {
    const PLAYER_HITBOX = new Vector2(40, 45);
    const PLAYER_HITBOX_OFFSET = new Vector2(-10, -15);
    const PLAYER_ANIMATION_PACK = new AnimationPack([
        new Animation('WALK')
            .setFrameSize(12, 12)
            .setBase(36, 0)
            .setFrames([[0, 0], [1, 0]]),

        new Animation('JUMP')
            .setFrameSize(12, 12)
            .setBase(60, 0)
            .setFrames([[0, 0]]),

        new Animation('FALL')
            .setFrameSize(12, 12)
            .setBase(60, 0)
            .setFrames([[0, 0]]),

        new Animation('IDLE')
            .setFrameSize(12, 12)
            .setBase(36, 0)
            .setFrames([[0, 0]]),
    ]);

    return class Player extends Entity {
        // creates a new player object
        constructor (canvas, bindInput) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, { size: PLAYER_HITBOX }, 100);

            this.hitboxOffset = PLAYER_HITBOX_OFFSET;
            this.controlsLocked = false;
            this.keys = {};
            this.hostile = false;

            this.renderPriority = Constants.PLAYER_RENDER_PRIORITY;

            this.lastRegen = -Infinity;
            // this.regeneration = 2; // TODO: Regen? Maybe?
            this.regeneration = 0;
            this.regenRate = 1 * 1000;

            this.onPlatform = false;
            this.timeLeftPlatform = -Infinity;

            this.canvas = canvas;
            this.screenMousePosition = new Vector2(-1, -1);

            this.invulnerable = false;
            this.invulnerablePeriod = 2;
            this.lastDamaged = -Infinity;

            this.coyoteTime = 0.1;

            this.giftGun = new GiftGun(this);
            this.flamethrower = new Flamethrower(this);

            if (bindInput) { this.bindInput(); }
            
            // bind to events
            this.onJump.listen(() => { 
                if (!this.isSpawned) {
                    return;
                }

                Sounds.playSfx(Sounds.SND_JUMP);
            });
            this.onDamage.listen(() => {
                if (!this.isSpawned) {
                    return;
                }

                Sounds.playSfx(Sounds.SND_DAMAGE, Sounds.SFX_DEFAULT_VOLUME * 4);
            });
            this.onStep.listen(() => {
                if (!this.isSpawned) {
                    return;
                }

                Sounds.playSfx(Sounds.SND_STEP);

                const size = this.body.getSize();
                const position = this.body.getPosition();
                const bottom = new Vector2(position.x + size.x / 2, position.y + size.y - 10);

                this.world.emitParticles(Math.random() * 3 + 1, {
                    velocityVariation: new Vector2(0, 2),
                    position: bottom,
                    velocity: new Vector2(-this.body.velocity.x / 10, -1),
                });
            });

            // bind to death
            this.onDeath.listen(() => {
                if (!this.isSpawned) {
                    return;
                }

                Sounds.playSfx(Sounds.SND_DEATH, Sounds.SFX_DEFAULT_VOLUME / 3);

                this.giftGun.disable();
                this.flamethrower.disable();

                this.sprite.setRotation(Math.PI / 2 * (this.sprite.isFlippedHorizontal ? 1 : -1));
                this.sprite.setPosition(this.sprite.position.add(new Vector2(0, 10)));

                this.world.emitParticles(25, {
                    lifetime: 1.5 * 1000,
                    color: {
                        start: '#ffffff',
                        finish: '#000000'
                    },
                    size: {
                        start: new Vector2(25, 25),
                        finish: new Vector2(0, 0)
                    },
                    position: this.body.getCenter(),
                    velocityVariation: new Vector2(8, 4),
                    velocity: new Vector2(0, -3)
                });
            });

            this.body.setTag('player', this);
            this.setAnimations(PLAYER_ANIMATION_PACK);
        }

        // fires when the player is damaged
        damage (amount, source) {
            if (this.invulnerable) {
                return;
            }

            const wasSuccessfulDamage = super.damage(amount, source);

            if (wasSuccessfulDamage) {
                this.lastDamaged = Date.now();
                this.invulnerable = true;
    
                this.wait(this.invulnerablePeriod).then(() => {
                    this.invulnerable = false;
                });
            }
        }

        // motion walk but checks controls
        motionWalk (direction, force) {
            if (this.controlsLocked && !force) {
                return;
            }

            super.motionWalk(direction);
        }

        // returns the time a key was pressed or null
        keyHeld (key) {
            return this.keys[key] !== undefined ? this.keys[key] : null;
        }

        // binds the player's input
        bindInput () {
            document.addEventListener('keydown', (event) => {
                if (this.controlsLocked){
                    return;
                }

                const key = event.key.toLowerCase();

                switch (key) {
                    case 'arrowup':
                    case 'w':
                        // begin jump/climb actions
                        this.keys[key] = Date.now();
                        if (!this.motionClimb()) {
                            this.motionJump();
                        }
                        break;
                    case 'arrowleft':
                    case 'a':
                        // begin moving left
                        this.keys[key] = Date.now();
                        this.motionWalk(-1);
                        break;
                    case 'arrowdown':
                    case 's':
                        // drop through platforms
                        this.disableSemiSolids();
                        this.keys[key] = Date.now();
                        break;
                    case 'arrowright':
                    case 'd':
                        // begin moving right
                        this.keys[key] = Date.now();
                        this.motionWalk(1);
                        break;
                }
            });

            document.addEventListener('keyup', (event) => {
                const key = event.key.toLowerCase();

                // always release the key even
                // if the controls are locked
                delete this.keys[key];

                if (this.controlsLocked){
                    return;
                }

                switch (key) {
                    case 'arrowleft':
                    case 'a':
                        if (this.keyHeld('arrowright') || this.keyHeld('d')) {
                            // pick up rightward movement
                            this.motionWalk(1);
                        } else {
                            // stop lefward movement
                            this.haltMovement();
                        }
                        break;
                    case 'arrowright':
                    case 'd':
                        if (this.keyHeld('arrowleft') || this.keyHeld('a')) {
                            // pick up leftward movement
                            this.motionWalk(-1);
                        } else {
                            // stop rightward movement
                            this.haltMovement();
                        }
                        break;
                    case 'arrowup':
                    case 'w':
                        // stop any climbing action
                        this.isClimbing = false;
                        break;
                    case 'arrowdown':
                    case 's':
                        // do nothing
                        break;
                }
            });

            this.canvas.addEventListener('mousemove', (event) => {
                var rect = this.canvas.getBoundingClientRect();

                var scaleX = this.canvas.width / rect.width;
                var scaleY = this.canvas.height / rect.height;

                const mouseX = (event.clientX - rect.left) * scaleX,
                    mouseY = (event.clientY - rect.top) * scaleY;

                this.screenMousePosition = new Vector2(mouseX, mouseY);
            });

            this.canvas.addEventListener('mousedown', (event) => {
                const wasLeftMouse = event.button === 0;

                if (this.controlsLocked || !this.isSpawned || !wasLeftMouse || (this.giftGun.firing() || this.flamethrower.firing())){
                    return;
                }
                
                if (this.giftGun.isActive()) {
                    this.giftGun.start();
                } else if (this.flamethrower.isActive()) {
                    this.flamethrower.start();
                } 
            });

            this.canvas.addEventListener('mouseup', (event) => {
                const wasLeftMouse = event.button === 0;

                if (this.controlsLocked || !this.isSpawned || !wasLeftMouse){
                    return;
                }

                this.giftGun.stop();
                this.flamethrower.stop();
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.giftGun.stop();
                this.flamethrower.stop();
                this.screenMousePosition = new Vector2(-1, -1);
            });
        }
        
        // returns the a vector direction from the player
        // to the mouse position
        getMouseDirection () {
            if (!this.isSpawned) {
                return new Vector2(0, 0);
            }

            const camera = this.world.camera;
            const cameraOffset = camera.getOffset(), cameraScale = camera.getScale();
            
            const screenPositionCenter = this.getScreenPosition(cameraOffset, cameraScale, true);
            const targetPoint = this.screenMousePosition;
        
            const angle = Math.atan2(targetPoint.y - screenPositionCenter.y,
                targetPoint.x - screenPositionCenter.x);

            return new Vector2(Math.cos(angle), Math.sin(angle)).normalize();
        }

        // locks the player's controls
        lockControls () {
            this.haltMovement();
            this.giftGun.stop();
            this.flamethrower.stop();
            this.controlsLocked = true;
        }

        // unlocks the player's controls
        releaseControls () {
            this.controlsLocked = false;
        }

        // overwritten canClimb to support comfortable jumps
        // off ledges without getting clipped by a climbable
        canClimb () {
            if (this.canCoyote()) {
                return false;
            }
            
            const climbable = this.touchingClimbable();

            if (this.body.floored){
                if (climbable){
                    const isAbove = this.body.position.y < climbable.position.y;
                    const isAtBottom = this.body.position.y + this.body.size.y === climbable.position.y;

                    if (isAbove && isAtBottom){
                        return false;
                    }

                    return super.canClimb();
                }
            } else {
                return super.canClimb();
            }
        }

        // jump respects coyote
        canJump () {
            return super.canJump() || this.canCoyote();
        }

        // returns true if the player can perform
        // a coyote jump
        canCoyote () {
            let coyoteTime = this.coyoteTime;

            if (this.touchingClimbable()) {
                // prevents clipping when jumping from ledge
                // and grabbing onto a climbable
                coyoteTime += 0.10;
            }

            if (!this.onPlatform && !this.isClimbing && !this.isJumping) {
                const elapsedSinceLeftFloor = (Date.now() - this.timeLeftPlatform) / 1000;
                const elapsedSinceDisableSemiSolid = (Date.now() - this.timeDisableSemiSolid) / 1000;

                if (elapsedSinceLeftFloor < coyoteTime && elapsedSinceDisableSemiSolid > coyoteTime) {
                    return true;
                }
            }

            return false;
        }

        // limits the max player speed and acceleration
        limitSpeed () {
            this.acceleration = Entity.acceleration / 2;
            this.maxSpeed = Entity.maxSpeed / 2;
            this.jumpPower = Entity.jumpPower / 1.5;
        }
        
        // fixes the players speed and acceleration
        fixSpeed () {
            this.acceleration = Entity.acceleration;
            this.maxSpeed = Entity.maxSpeed;
            this.jumpPower = Entity.jumpPower;
        }

        // fires whenever the player collides
        // with a hostile entity
        onHostileEntityCollision (entity) {
            if (entity.isDead() || this.isDead() || this.controlsLocked) {
                return;
            }

            // extract physics bodies
            // and determine how the collision happened
            const playerBody = this.body;
            const entityBody = entity.body;

            const entityPosition = entityBody.getPosition();
            const entitySize = entityBody.getSize();
            const entityCenter = entityBody.getCenter();

            const playerCenter = playerBody.getCenter();
            const playerSize = playerBody.getSize();
            const playerPosition = playerBody.getPosition();
            const playerVelocity = playerBody.getVelocity();

            const cameDown = playerVelocity.y > 0 && playerBody.previousPosition.y <= playerPosition.y;
            const landedOnTop = playerPosition.y + playerSize.y <= entityPosition.y + entitySize.y / 1.5;
            
            if (entity.squashable && cameDown && landedOnTop) {
                // player bounced on it, push them up
                let elapsed = Date.now() - (this.keyHeld('arrowup') || this.keyHeld('w') || -Infinity);
                
                playerBody.position.y = entityPosition.y - playerSize.y;
                playerBody.velocity.y = -10 + (elapsed < 100 ? -10 : 0);

                Sounds.playSfx(Sounds.SND_SMOOSH);
                entity.damage(entity.squishDamage, this);

                this.world.emitParticles(Math.random() * 2 + 7, {
                    velocityVariation: new Vector2(10, 2),
                    position: new Vector2(playerCenter.x, playerPosition.y + playerSize.y),
                });
            } else if (!this.invulnerable) {
                // player ran into it, knock them back
                let direction = Math.sign(playerCenter.x - entityCenter.x);

                if (direction === 0) {
                    // if they somehow end up perfectly aligned,
                    // just knock them to the right
                    direction = 1;
                }

                this.damage(entity.baseDamage, entity);
                this.nudge(direction);
            }
        }

        // handles any collision between player and any entity
        handleEntityCollision (entity) {
            if (entity.hostile) {
                this.onHostileEntityCollision(entity);
            }
        }

        // handles generic collisions with tiles
        handleTileCollision (tile) {
            if (tile.promptText !== null) {
                tile.togglePrompt(true);
            }

            if (tile.spriteIndex === Tile.SPIKE && !this.invulnerable) {
                const tileCenter = tile.body.getCenter();
                const playerCenter = this.body.getCenter();

                const direction = Math.sign(tileCenter.x - playerCenter.x);

                this.nudge(direction, 1.65);
                this.damage(Tile.SPIKE_DAMAGE, tile);
            }
        }

        // fires when collision has started with player
        // and reroutes to appropriate handler
        onCollision (other) {
            const tile = other.getTag('tile');
            const entity = other.getTag('entity');
            const collectable = other.getTag('collectable');

            if (tile) {
                this.handleTileCollision(tile);
            } else if (entity) {
                this.handleEntityCollision(entity);
            } else if (collectable) {
                collectable.collect(this);
            }
        }

        // fires when collision has ended with player
        onCollisionEnd (other) {
            const tile = other.getTag('tile');

            if (tile) {
                if (tile.promptText !== null) {
                    tile.togglePrompt(false);
                }

            }
        }

        // fires when the player spawns
        onSpawn (...args) {
            super.onSpawn(...args);

            // just to be safe
            this.sprite.setTransparency(1);
            this.sprite.flipHorizontal(false);

            this.invulnerable = false;

            this.flamethrower.disable();
            this.giftGun.disable();
        }

        // fires when the player despawn
        onDespawn () {
            this.body.resetState();
            super.onDespawn();
        }

        // updates the player
        update (deltaTime) {
            super.update(deltaTime);

            if (this.health < this.maxHealth && this.health > 0) {
                const elapsedSinceLastRegen = Date.now() - this.lastRegen;
    
                if (elapsedSinceLastRegen > this.regenRate) {
                    this.lastRegen = Date.now();
                    this.heal(this.regeneration);
                }
            }

            if (this.flamethrower.isActive()) {
                this.flamethrower.update(deltaTime);
            }

            if (this.giftGun.isActive()) {
                this.giftGun.update(deltaTime);
            }

            if (this.onPlatform && !this.body.floored && !this.isClimbing && !this.isJumping) {
                // player just fell off a platform
                this.timeLeftPlatform = Date.now();
            } else if (this.body.floored) {
                this.timeLeftPlatform = -Infinity;
            }
            
            this.onPlatform = this.body.floored;
        }

        // renders the player
        render (context, offset, scale) {
            const elapsed = (Date.now() - this.lastDamaged);

            if (this.invulnerable) {
                if (Math.sin(elapsed * 40) > 0.5) {
                    this.sprite.visible = false;
                } else {
                    this.sprite.visible = true;
                }
            } else {
                this.sprite.visible = true;
            }

            super.render(context, offset, scale);

            if (this.flamethrower.isActive() && !this.giftGun.isActive()) {
                this.flamethrower.render(context, offset, scale);
            }
        }
    }
})();