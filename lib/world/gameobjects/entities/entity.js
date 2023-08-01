import { Projectile } from "/lib/world/gameobjects/projectiles/projectile.js";
import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Event } from "/lib/PhysicsJS2D/src/event.js";
import { Constants } from "/lib/misc/constants.js";
import { GameObject } from "../gameObject.js";

export const Entity = (function () {
    return class Entity extends GameObject {
        // standard movement values
        static baseSpeed = 3;
        static acceleration = 3;
        static maxSpeed = 10;
        static jumpPower = 20;
        // standard damage values
        static baseDamage = 10;
        static intakeFlameDamage = 0.09;
        static squishDamage = 2;

        // creates a new entity object
        constructor (spriteTexture, spriteSize, bodyProperties, maxHealth) {
            super(spriteTexture, spriteSize, bodyProperties);

            this.baseSpeed = Entity.baseSpeed;
            this.acceleration = Entity.acceleration;
            this.maxSpeed = Entity.maxSpeed;
            this.jumpPower = Entity.jumpPower;
            this.baseDamage = Entity.baseDamage;
            this.squishDamage = Entity.squishDamage;
            this.intakeFlameDamage = Entity.intakeFlameDamage;

            this.health = maxHealth;
            this.maxHealth = maxHealth;
            this.healthBarEnabled = true;
            this.isAlive = true;
            this.deathTime = null;

            this.hostile = false;
            this.squashable = false;

            this.behavior = null; // the behavior of the entity

            this.currentAnimation = null;
            this.animations = null;

            this.despawnDelay = 4;

            this.timeDisableSemiSolid = -Infinity;

            this.manuallyAnimated = false;
            this.renderPriority = Constants.ENTITY_RENDER_PRIORITY;

            this.walkingDirection = 0; // -1 = left, 1 = right, 0 = none

            this.isJumping = false;  // is the entity jumping
            this.isClimbing = false; // is the entity climbing
            this.isNudging = false; // is the entity nudging (pushed state)

            this.onJump = new Event();
            this.onLand = new Event();
            this.onClimb = new Event();
            this.onNudge = new Event();
            this.onStep = new Event();

            this.onDamage = new Event();
            this.onDeath = new Event();

            this.body.onFloor.listen(() => {
                this.onLand.trigger();
            });

            this.body.collisionGroup = 'entity';
            this.body.setTag('entity', this);
        }

        // sets the behavior of the entity
        setBehavior (behavior) {
            this.behavior = behavior;
        }

        // disable the entity's behavior
        disableBehavior () {
            if (this.behavior !== null) {
                this.behavior.disable();
            }
        }

        // enable the entity's behavior
        enableBehavior () {
            if (this.behavior !== null) {
                this.behavior.enable();
            }
        }

        // causes the entity to take damage
        damage (amount, source = null) {
            if (this.isDead() || typeof amount !== 'number' || Number.isNaN(amount)){
                return false;
            }

            this.health = Math.max(0, this.health - amount);

            this.onDamage.trigger(amount, this.health);

            if (this.health === 0) {
                if (this.animations !== null && this.animations.DEATH) {
                    this.playAnimation(this.animations.DEATH);
                }
                
                this.body.anchor();
                this.onDeath.trigger();
                this.isAlive = false;
                this.deathTime = Date.now();
                
                if (source !== null && this.world !== null) {
                    const playerDirectDamage = source.constructor && source.constructor.name === 'Player';
                    const playerProjectileDamage = source instanceof Projectile && source.fromPlayer;

                    if (playerDirectDamage || playerProjectileDamage) {
                        this.world.score.increment('enemiesDestroyed');
                    }
                }
            }

            return true;
        }

        // causes the entity to heal
        heal (amount) {
            this.health = Math.min(this.maxHealth, this.health + amount);

            if (this.health > 0 && !this.isAlive) {
                // entity was dead, but is now alive
                this.body.unanchor();
                this.isAlive = true;
                this.deathTime = null;
            }
        }

        // returns true if the entity has died
        isDead () {
            return this.health <= 0 || !this.isAlive;
        }

        // determines whether or not and entity
        // can peform a legal jump at its current state
        canJump () {
            return this.body.floored && !this.isJumping;
        }

        // causes an entity to perform a vertical jump
        motionJump () {
            if (!this.canJump()) {
                return;
            }

            this.isJumping = true;
            this.onJump.trigger();

            // apply forces
            const jumpPower = this.jumpPower;
            
            this.body.velocity.y = -jumpPower;

            // bind to the end of the jump
            const jumpEnd = () => {
                this.isJumping = false;
                this.onLand.unlisten(jumpEnd);
            }

            this.onLand.listen(jumpEnd);
        }

        // determines whether or not an entity
        // can walk at its current state    
        canWalk () {
            return this.isSpawned;
        }

        // causes an entity to start moving in the specified direction
        // direction should be a value between -1 and 1
        motionWalk (direction) {
            if (this.walkingDirection === direction || !this.canWalk()) {
                return;
            }
            
            this.walkingDirection = direction;
            
            let baseSpeed = this.baseSpeed;
            let acceleration = this.acceleration;

            if (Math.sign(this.body.velocity.x) !== direction) {
                // start moving immediately if not currrently moving
                // in the same direction
                this.body.velocity.x = baseSpeed * direction;
            }

            // start moving in the specified direction
            let timeSave = Date.now();
            let movingUpdate = () => {
                if (this.walkingDirection !== direction || !this.canWalk() || this.isDead()) {
                    // stop moving if the direction has changed
                    this.onUpdate.unlisten(movingUpdate);
                    this.motionSlow();
                    return;
                }
                
                // cancel any friction effects immediately
                this.body.friction = 1;

                let maxSpeed = Math.max(Number.EPSILON, this.maxSpeed);

                // gradually speed up in velocity
                let nextVelocity = this.body.velocity.x + (acceleration / 10) *
                    (1 - Math.abs(this.body.velocity.x) / maxSpeed) * direction;
                
                // limit the max reachable velocity
                if (Math.abs(nextVelocity) > maxSpeed) {
                    nextVelocity = maxSpeed * direction;
                } else if (nextVelocity < -maxSpeed) {
                    nextVelocity = -maxSpeed;
                }

                let elapsed = Date.now() - timeSave;

                if (this.body.floored && this.body.velocity.x !== 0 && elapsed > 200) {
                    // trigger the step event every 200ms
                    this.onStep.trigger();
                    timeSave = Date.now();
                }

                this.body.velocity.x = nextVelocity;
            };

            this.onUpdate.listen(movingUpdate);
            movingUpdate();
        }

        // stops the current movement if the entity
        // is moving using the motionWalk method
        haltMovement () {
            this.walkingDirection = 0;
        }

        // gradually slows down an entity's movement
        // to a stop
        motionSlow () {
            let acceleration = this.acceleration;
            let maxSpeed = this.maxSpeed;

            // start slowing down
            let slowStart = Date.now();
            let slowInterval = setInterval(() => {
                if (this.walkingDirection !== 0 || Math.abs(this.body.velocity.x) === 0 || this.isDead()) {
                    // stop slowing down if the direction has changed
                    clearInterval(slowInterval);
                    return;
                }

                let elapsedScale = (Date.now() - slowStart) / 1000 * acceleration * 2;

                if (elapsedScale > maxSpeed) {
                    // clamp the elapsed scale to the max speed
                    elapsedScale = maxSpeed;
                }

                // apply force opposite to where the entity
                // is currently travelling
                let oppositeTravel = Math.sign(this.body.velocity.x) * -1;
                let nextVelocity = this.body.velocity.x + (oppositeTravel * elapsedScale);

                if (Math.abs(nextVelocity) > Math.abs(this.body.velocity.x)){
                    // overshot the slowdown and is now moving in the
                    // opposite direction, just zero out the velocity
                    this.body.velocity.x = 0;
                } else {
                    // ensure the velocity never changes
                    // the direction it is travelling in
                    if (this.body.velocity.x >= 0 && nextVelocity >= 0 ||
                        this.body.velocity.x <= 0 && nextVelocity <= 0) {
                        this.body.velocity.x = nextVelocity;
                    }
                }
            });
        }

        // determines whether or not an entity
        // can climb at its current state
        canClimb () {
            return this.isSpawned && !this.isClimbing && this.touchingClimbable() !== null;
        }

        // tries to climb if the entity is near
        // a climbable object, returns true if
        // the entity is now climbing
        motionClimb () {
            const CLIMB_SPEED = 10;
            const MOVE_SPEED = 4;

            if (!this.canClimb()) {
                return false;
            }

            this.isClimbing = true;
            this.onClimb.trigger();

            let maxSpeed = this.maxSpeed;

            // reduce maximum speed while climbing
            this.maxSpeed = MOVE_SPEED;

            let climbInterval = setInterval(() => {
                if (this.touchingClimbable() === null || !this.isClimbing || this.isDead()) {
                    // stop climbing if no longer touching a climbable object
                    clearInterval(climbInterval);
                    this.isClimbing = false;
                    this.maxSpeed = maxSpeed;
                    return;
                }

                // apply forces
                this.body.velocity.y = -CLIMB_SPEED;
            });

            return true;
        }

        // pushes the entity up and away in a
        // given direction this method has a cooldown
        nudge (direction, intensity = 1) {
            if (this.isNudging) {
                return false;
            }

            this.isNudging = true;

            // apply force in the specified direction
            this.body.velocity.x = 8 * direction * intensity;
            this.body.velocity.y = -8 * intensity;
            this.body.friction = 0.93;

            this.wait(0.50).then(() => {
                this.isNudging = false;
            });

            this.onNudge.trigger();

            return true;
        }

        // returns the climbable object that the entity
        // is currently touching, or null
        touchingClimbable () {
            const collisions = this.body.getCollisions();

            for (let i = 0; i < collisions.length; i++) {
                const collision = collisions[i];

                if (collision.getTag('climbable')) {
                    return collision;
                }
            }

            return null;
        }

        // figures out the current animation this
        // entity should be playing
        determineAnimationState () {
            if (this.animations === null || this.manuallyAnimated) {
                return;
            }
            
            // set sprite facing direction
            if (this.body.velocity.x < 0) {
                this.sprite.flipHorizontal(true);
            } else if (this.body.velocity.x > 0) {
                this.sprite.flipHorizontal(false);
            }

            
            // extract current state information
            let isJumping = this.body.velocity.y < 0;
            let isFalling = this.body.velocity.y > 0;
            let isOnFloor = this.body.floored && !isJumping && !isFalling;
            let isMoving = Math.abs(this.body.velocity.x) > 0;
            let isWalking = isOnFloor && isMoving;
            
            // body is completely at rest
            let notDoingAnything = !isJumping && !isFalling && !isMoving && isOnFloor;
            
            let animations = this.animations;
            let currentAnimation = this.currentAnimation;

            // check if there is no animation playing
            // or the current animation could be interrupted
            if (currentAnimation === null || !currentAnimation.forced) {
                if (isJumping && currentAnimation !== animations.JUMP) {
                    this.playAnimation(animations.JUMP);
                } else if (isFalling && currentAnimation !== animations.FALL) {
                    this.playAnimation(animations.FALL);
                } else if (isWalking && currentAnimation !== animations.WALK) {
                    this.playAnimation(animations.WALK);
                } else if (notDoingAnything && currentAnimation !== animations.IDLE) {
                    this.playAnimation(animations.IDLE);
                }

                if (isWalking) {
                    this.setAnimationSpeed(1 / Math.abs(this.body.velocity.x * 0.90));
                }
            }
        }

        // allows entitiy to drop down off of
        // any semi-solids its standing on by
        // temporarily disabling their collision
        disableSemiSolids () {
            const collisions = this.body.getCollisions();

            for (let i = 0; i < collisions.length; i++) {
                const collision = collisions[i];

                if (collision.semiSolid) {
                    collision.semiSolid = false;

                    this.wait(0.50).then(() => {
                        collision.semiSolid = true;
                    });
                }
            }

            this.timeDisableSemiSolid = Date.now();
        }

        // draws a health bar above the entity
        drawHealthBar (context, offset, scale) {
            const BAR_WIDTH = 100 * scale;
            const BAR_HEIGHT = 10 * scale;
            const BAR_OFFSET = 20 * scale;

            let healthPercentage = this.health / this.maxHealth;

            const bodyPosition = this.body.position;
            const bodySize = this.body.size;

            const healthBarPosition = new Vector2(bodyPosition.x * scale + offset.x * scale + bodySize.x * scale / 2 - BAR_WIDTH / 2,
                bodyPosition.y * scale + offset.y * scale - BAR_OFFSET).floor();

            context.fillStyle = '#FF0000';
            context.fillRect(healthBarPosition.x, healthBarPosition.y,
                BAR_WIDTH, BAR_HEIGHT);

            context.fillStyle = '#00FF00';
            context.fillRect(healthBarPosition.x, healthBarPosition.y,
                BAR_WIDTH * healthPercentage, BAR_HEIGHT);
        }

        // returns the current animation name
        getCurrentAnimationName () {
            return this.currentAnimation ? this.currentAnimation.name : 'NONE';
        }

        // sets the entity's animation pack
        setAnimations (animations) {
            this.animations = animations;
        }

        // plays an animation on the entity's sprite
        playAnimation (animation) {
            this.currentAnimation = animation;
            this.sprite.play(animation);
        }

        // stops the current animation
        stopAnimation () {
            this.currentAnimation = null;
            this.sprite.stop();
        }

        // sets the speed of the current animation
        setAnimationSpeed (fps) {
            this.sprite.setFps(fps);
        }

        // fires when the entity despawns
        onDespawn () {
            this.isNudging = false; // since waiting promises never resolve
            super.onDespawn();
        }

        // updates the entity
        update (deltaTime) {
            if (this.isDead()) {
                if (this.getDespawnTimer() === 1) {
                    this.despawn();
                }
                return;
            } else {
                if (this.body.position.y >= this.world.maxFallY) {
                    // entities that fall too far are killed instantly
                    // super update will later despawn it
                    this.damage(Infinity, null);
                }
            }

            if (this.behavior !== null) {
                this.behavior.update(deltaTime);
            }

            this.determineAnimationState();
            
            super.update(deltaTime);
        }

        // returns an amount between 0 and 1
        // representing how much time has passed
        // since the entity died and how close it
        // is to despawning
        getDespawnTimer () {
            let despawnPercent = (Date.now() - this.deathTime) / 1000 / this.despawnDelay;
                
            if (despawnPercent > 1) {
                despawnPercent = 1;
            }

            return despawnPercent;
        }
w
        // renders the entity
        render (context, offset, scale) {
            super.render(context, offset, scale);

            if (this.health < this.maxHealth && this.health > 0 && this.healthBarEnabled) {
                this.drawHealthBar(context, offset, scale);
            } else if (this.health <= 0) {
                const despawnPercentage = this.getDespawnTimer();
                
                this.sprite.transparency = 1 - despawnPercentage;
            }
        }
    }
})();