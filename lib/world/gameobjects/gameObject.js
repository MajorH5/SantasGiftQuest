import { AnimatedSprite } from '../../sprites/animatedSprite.js';
import { Vector2 } from '../../PhysicsJS2D/src/vector2.js';
import { Event } from '../../PhysicsJS2D/src/event.js';
import { Body } from '../../PhysicsJS2D/src/body.js';
import { Constants } from '../../misc/constants.js';

export const GameObject = (function () {
    return class GameObject {
        // creates a new game object
        constructor (spriteTexture, spriteSize, bodyProperties) {
            // components of the object
            this.sprite = new AnimatedSprite(spriteTexture || null, spriteSize);
            this.body = new Body(bodyProperties || {});

            // events of object
            this.onUpdate = new Event();
            this.onRender = new Event();

            // state of the object
            this.isSpawned = false;
            this.world = null;

            this.hitboxOffset = new Vector2(0, 0);
            this.drawHitbox = false;
            this.renderPriority = Constants.DEFAULT_RENDER_PRIORITY;

            // bind collision handlers
            this.body.collision.listen(this.onCollision.bind(this));
            this.body.collisionEnded.listen(this.onCollisionEnd.bind(this));
        }

        // event called when the object is updated
        update (deltaTime) {
            this.sprite.position = this.body.position;
            this.sprite.rotation = this.body.rotation;
            this.sprite.update(deltaTime);
            this.onUpdate.trigger(deltaTime)

            if (this.isSpawned && this.body.position.y >= this.world.maxFallY) {
                // avoid memory leaks from objects that are
                // continually falling out of the world
                this.despawn();
            }
        }

        // event called when the object is rendered
        render (context, offset, scale) {
            const spriteOffset = new Vector2(offset.x + this.hitboxOffset.x, offset.y + this.hitboxOffset.y)

            this.sprite.render(context, spriteOffset, scale);

            if (this.drawHitbox) {
                this.renderHitbox(context, offset, scale);
            }

            this.onRender.trigger(context, offset, scale);
        }

        // returns the elapsed time of the world its spawned in
        getElapsedTime () {
            if (!this.isSpawned) {
                return 0;
            }
            
            return this.world.elapsedTimeMs;
        }

        // renders the hitbox of the gameObject
        renderHitbox (context, offset, scale) {
            const screenPosition = this.getScreenPosition(offset, scale);

            context.strokeStyle = 'red';
            context.strokeRect(
                screenPosition.x,
                screenPosition.y,
                this.body.size.x * scale,
                this.body.size.y * scale
            );
        }

        // returns the screen position of the object
        // given the offset and scale
        getScreenPosition (offset, scale, center) {
            let position = center ? this.body.getCenter() : this.body.getPosition();

            position = position.scale(scale);
            offset = offset.scale(scale);

            return position.add(offset);
        }

        // returns true if the object is visible
        // on the screen
        isVisibleOnScreen (offset, scale) {
            if (!this.isSpawned) {
                return false;
            }

            const canvas = this.world.canvas;
            const screen = new Vector2(canvas.width, canvas.height);

            const screenSize = this.body.size.scale(scale);
            const screenPosition = this.getScreenPosition(offset, scale);

            const visible =  (screenPosition.x + screenSize.x > 0 && screenPosition.x < screen.x) &&
                (screenPosition.y + screenSize.y > 0 && screenPosition.y < screen.y);

            return visible;
        }

        // allows the gameObject to pause itself
        // if its spawned in
        wait (timeSeconds) {
            return new Promise((resolve) => {
                let elapsedMs = 0;
                const onUpdate = (deltaMs) => {
                    elapsedMs += deltaMs;
                    if (elapsedMs >= timeSeconds * 1000) {
                        this.onUpdate.unlisten(onUpdate);
                        resolve();
                    }
                };
                this.onUpdate.listen(onUpdate);
            });
        }

        // uses the world to create a tween object
        createTween (duration, tweenData, easing) {
            if (!this.isSpawned || this.world === null) {
                throw new Error("Can't create tween on object that is not spawned!");
            }

            return this.world.createTween(duration, tweenData, easing);
        }

        // allows you to set the position of the object
        setPosition (position, centered = false) {
            if (centered) {
                position = position.subtract(this.body.size.scale(0.5));
            }

            this.body.position.x = position.x;
            this.body.position.y = position.y;
        }

        // get position of the object
        getPosition () {
            return this.body.getPosition();
        }

        // returns the center point of the gameobject
        getCenter () {
            return this.body.getCenter();
        }

        // event called when the object
        // has collided with another object
        onCollision (otherBody) {

        }

        // event called when the object
        // has a collision end with another object
        onCollisionEnd (otherBody) {
            
        }

        // event called when the object is spawned
        onSpawn (world) {
            this.isSpawned = true;
            this.world = world;
        }

        // event called when the object is despawned
        onDespawn () {
            this.isSpawned = false;
            this.world = null;
            this.onUpdate.clear();
        }
        
        // despawns itself if it is spawned
        despawn () {
            if (this.isSpawned) {
                this.isSpawned = false;
                // on despawn will be triggered by gameObjectManager
            } else {
                console.warn('Tried to despawn an object that is not spawned');
            }
        }
    }
})();