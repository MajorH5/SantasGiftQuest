import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Event } from "/lib/PhysicsJS2D/src/event.js";
import { Constants } from "/lib/misc/constants.js";
import { GameObject } from "../gameObject.js";

export const Collectable = (function () {
    return class Collectable extends GameObject {
        // creates a new ollectable object of the given index
        constructor (spriteIndex, spawnPosition, flashIndex) {
            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: Constants.TILE_DEFAULT_SIZE,
                ignoreGravity: true
            });

            this.collected = new Event();
            
            this.flashIndex = flashIndex || null;
            this.spawnPosition = spawnPosition;
            this.type = spriteIndex;

            this.despawnTime = 3;
            this.fadeTime = 1;
            this.flashTimer = 0;
            
            this.isCollected = false;
            this.collectTime = null;

            this.renderPriority = Constants.COLLECTABLE_RENDER_PRIORITY;
            
            this.setPosition(spawnPosition);
            this.sprite.setIndex(spriteIndex);
            this.body.setTag('collectable', this);
        }

        // sets the position of the collectable
        setPosition (position) {
            this.body.position = position;
            this.spawnPosition = position;
        }

        // collects the collectable
        collect (player) {
            if (this.isCollected) {
                return;
            }

            if (this.flashIndex !== null) {
                this.flashTimer = 20;
            } else {
                this.sprite.size = this.sprite.size.scale(1.001);
            }

            this.collectTime = this.getElapsedTime();
            this.isCollected = true;
            this.collected.trigger();

            this.wait(this.despawnTime).then(() => {
                if (this.isCollected) {
                    this.despawn();
                }
            });
        }

        // updates the current floating position
        float (deltaTime) {
            const offset = -(1 + Math.sin(this.getElapsedTime() / 250)) / 2 * Constants.TILE_SIZE / 2;
            this.body.position.y = this.spawnPosition.y + offset;
        }

        // updates the flashing state of the collectable
        flash (deltaTime) {
            if (this.flashTimer > 0) {
                this.flashTimer--;

                if (this.flashTimer <= 0){
                    this.flashTimer = 0;
                    this.sprite.visible = false;
                }

                if (this.flashTimer % 10 === 0) {
                    this.sprite.setIndex(this.type);
                } else if (this.flashTimer % 5 === 0) {
                    this.sprite.setIndex(this.flashIndex);
                }
            }
        }

        // updates the fade effect of the collectable
        fade (deltaTime) {
            let elapsed = (this.getElapsedTime() - this.collectTime) / 1000 / this.fadeTime;

            if (elapsed >= 1) {
                elapsed = 1;
            }

            this.sprite.transparency = 1 - elapsed;
        }

        // updatse the collectable object
        update (deltaTime) {
            super.update(deltaTime);
            
            if (!this.isCollected) {
                this.float(deltaTime);
            } else if (this.flashTimer > 0) {
                this.flash(deltaTime);
            }else if (this.collectTime !== null && this.flashTimer === 0) {
                this.fade(deltaTime);
            }
        }
    }
})();