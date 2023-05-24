import { Vector2 } from "./PhysicsJS2D/src/vector2.js";
import { AnimationPack } from "./animationPack.js";
import { Constants } from "./constants.js";
import { Animation } from "./animation.js";
import { Entity } from "./entity.js";
import { Grinch } from "./grinch.js";

export const Penguin = (function () {
    const PENGUIN_MAX_SPEED = 3;
    const PENGUIN_HITBOX = new Vector2(30, 35);
    const PENGUIN_HITBOX_OFFSET = new Vector2(-15, -25);
    const PENGUIN_ANIMATION_PACK = new AnimationPack([
        new Animation('WALK')
            .setFrameSize(12, 12)
            .setBase(36, 12)
            .setFrames([[0, 0], [1, 0]]),

        new Animation('JUMP')
            .setFrameSize(12, 12)
            .setBase(36, 12)
            .setFrames([[0, 0]]),

        new Animation('FALL')
            .setFrameSize(12, 12)
            .setBase(36, 12)
            .setFrames([[0, 0]]),

        new Animation('IDLE')
            .setFrameSize(12, 12)
            .setBase(36, 12)
            .setFrames([[0, 0]]),

        new Animation('DEATH')
            .setFrameSize(12, 12)
            .setBase(60, 12)
            .setFrames([[0, 0]])
    ]);

    return class Penguin extends Entity {
        // creates a new penguin entity object
        constructor (spawnPosition, isDocile = true) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, { size: PENGUIN_HITBOX }, 10);

            // static physical properties
            this.hitboxOffset = PENGUIN_HITBOX_OFFSET;
            this.maxSpeed = PENGUIN_MAX_SPEED;

            // behavior props
            this.shouldReverse = false;
            this.lastWalkingDirection = 0;
            this.waitTimer = 0;
            this.docile = isDocile;
            this.squishDamage = Infinity;
            this.timeAwayFromGrinch = 0;

            if (!isDocile) {
                this.baseDamage *= 2;
                this.squishDamage = 3;
                this.maxSpeed *= 1.5;
                this.acceleration /= 2;
                this.maxHealth *= 3.5;
                this.health = this.maxHealth;
            } else {
                this.reverseDirection();
            }
            
            // allow player to jump on
            this.squashable = true;
            this.hostile = true;
            
            // set inital conditions
            this.setPosition(spawnPosition || new Vector2(0, 0));
            this.setAnimations(PENGUIN_ANIMATION_PACK);

            this.onLand.listen(() => {
                this.body.angularVelocity = 0;
                this.body.rotation = 0;
            });
        }

        // returns the next tile that the penguin will be on
        // if there is no tile, returns null
        getNextStandingTile () {
            if (!this.isSpawned) {
                return null;
            }

            const tileMap = this.world.tileMap;

            const position = this.body.position;
            const size = this.body.size;
            const direction = this.walkingDirection;

            const checkPosition = new Vector2(position.x + (size.x * (direction === -1 ? 0 : 1)), position.y + size.y)

            const nextTile = tileMap.getTileAt(checkPosition);

            return nextTile || null;
        }

        // returns the next tile that the penguin could
        // possibly run into
        getNextFacingTile () {
            if (!this.isSpawned) {
                return null;
            }

            const tileMap = this.world.tileMap;

            const position = this.body.position;
            const size = this.body.size;
            const direction = this.walkingDirection;

            const sensorOffset = 20;
            const checkPosition = new Vector2(position.x + ((size.x * (direction === -1 ? 0 : 1) + sensorOffset) * direction), position.y + sensorOffset)

            const nextTile = tileMap.getTileAt(checkPosition);

            return nextTile || null;
        }

        // reverses the current walking direction of the penguin
        // if the penguin is not moving, it will start moving
        reverseDirection () {
            if (this.walkingDirection === 0) {
                if (this.lastWalkingDirection === 0) {
                    // first time walking
                    this.motionWalk(Math.random() > 0.5 ? 1 : -1);
                } else {
                    // reverse last movement direction
                    this.motionWalk(this.lastWalkingDirection * -1);
                }
            } else {
                this.motionWalk(this.walkingDirection * -1);
            }

            this.lastWalkingDirection = this.walkingDirection;
        }

        // main loop for penguin, walks left and right and pauses
        // if it hits a wall or edge of cliff
        behaveDocile (deltaTime) {
            const nextFloorTile = this.getNextStandingTile();
            const nextWallTile = this.getNextFacingTile();

            const noGoodFloorTile = (nextFloorTile === null || !(nextFloorTile.body.solid || nextFloorTile.body.semiSolid));
            const noGoodWalkingArea = (nextWallTile && nextWallTile.body.solid);

            if ((noGoodFloorTile || noGoodWalkingArea) && this.waitTimer === 0) {
                this.haltMovement();
                this.waitTimer = 3 * 1000;
            }
        }

        // main loop for penguin, chases the player
        behaveAgressive (deltaTime) {
            const MAX_TIME_AWAY = 5 * 1000;
            const player = this.world.player;

            if (player.isDead()){
                this.docile = true;
                this.motionWalk(Math.random() > 0.5 ? 1 : -1);
                return;
            }
            
            const playerCenter = player.body.getCenter();
            const penguinCenter = this.body.getCenter();

            const distance = playerCenter.x - penguinCenter.x;
            const direction = Math.sign(distance);
            const absDistance = Math.abs(distance);

            if (absDistance <= Constants.TILE_SIZE * 4) {
                this.motionWalk(direction);
            } else {
                const [grinch] = this.world.gameObjectManager.getGameObjectsByType(Grinch);

                if (grinch === undefined) {
                    return;
                }

                const distanceToGrinch = grinch.body.getCenter().x - penguinCenter.x;

                if (Math.abs(distanceToGrinch) > Constants.TILE_SIZE) {
                    if (this.timeAwayFromGrinch < MAX_TIME_AWAY || Math.random() < 0.07) {
                        this.motionWalk(Math.sign(distanceToGrinch));
                    } else {
                        this.timeAwayFromGrinch += deltaTime;
                    }
                } else {
                    this.timeAwayFromGrinch = 0;
                    this.haltMovement();
                }

            }
            
            // push away from neighboring penguins
            // by adding to currrent velocity
            const penguins = this.world.gameObjectManager.getGameObjectsByType(Penguin);

            for (const penguin of penguins) {
                if (penguin === this) {
                    continue;
                }

                const penguinCenter = penguin.body.getCenter();
                const thisCenter = this.body.getCenter();

                const distance = penguinCenter.x - thisCenter.x;

                let direction = Math.sign(distance) * -1;

                
                if (direction === 0) {
                    direction = Math.random() < 0.5 ? 1 : -1;
                }

                const absDistance = Math.abs(distance);

                const pushForce = (Constants.TILE_SIZE - absDistance) / Constants.TILE_SIZE;

                if (pushForce <= 0) {
                    continue;
                }

                this.body.position.x += pushForce * 3 * direction;

            }
        }

        // updates and performs penguin logic
        update (deltaTime) {
            if (this.docile) {
                if (this.waitTimer > 0) {
                    this.waitTimer -= deltaTime;
                    
                    if (this.waitTimer <= 0) {
                        this.waitTimer = 0;
    
                        // just finished the pause
                        // now start walking the other way
                        this.reverseDirection();
                    }
                } else {
                    // penguin is walking, check for wall/cliff
                    this.behaveDocile(deltaTime);
                }
            } else {
                // penguin is not docile, so it is chasing the player
                this.behaveAgressive(deltaTime);
            }

            super.update(deltaTime);
        }
    }
})();