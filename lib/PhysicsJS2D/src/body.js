import { Vector2 } from "./vector2.js";
import { Event } from "./event.js";

// class for a physics body

export const Body = (function () {
    return class Body {
        constructor (properties = {}) {
            // body physical properties
            this.position = properties.position || Vector2.zero;
            this.velocity = properties.velocity || Vector2.zero;
            this.size = properties.size || Vector2.zero;
            
            this.rotation = properties.rotation || 0;
            this.friction = 
                typeof properties.friction === 'number' ?
                    properties.friction : 1;
            this.gravityScale = 
                typeof properties.gravityScale === 'number' ?
                    properties.gravityScale : 1;

            this.angularVelocity = properties.angularVelocity || 0;

            this.angularFriction =
                typeof properties.angularVelocity === 'number' ?
                    properties.angularVelocity : 0.97;

            this.previousPosition = this.position.clone();
            this.previousSize = this.size.clone();

            // body properties
            this.boundsConstrained =
                typeof properties.boundsConstrained == 'boolean' ?
                    properties.boundsConstrained : true;
            this.anchored = properties.anchored || false;
            this.ignoreGravity = properties.ignoreGravity || false;
            this.hasCollisions = 
                typeof properties.hasCollision === 'boolean' ?
                    properties.hasCollision : true;
            this.collisionGroup = properties.collisionGroup || null;
            this.collidesWith = properties.collidesWith || null;
            this.resolveCollisions =
                typeof properties.resolveCollisions === 'boolean' ?
                    properties.resolveCollisions : true;
            this.semiSolid = properties.semiSolid || false;
            this.solid = properties.solid || false;

            // internal body state
            this.colliding = new Set();
            this.floored = false;
            this.tags = {};

            // body events
            this.collision = new Event();
            this.collisionEnded = new Event();
            this.outOfBounds = new Event();
            this.updated = new Event();
            this.onFloor = new Event();
        }

        getPosition () {
            // returns the position of the body
            return this.position;
        }

        getSize () {
            // returns the size of the body
            return this.size;
        }

        getVelocity () {
            // returns the velocity of the body
            return this.velocity;
        }

        getCenter () {
            // returns the centere point 
            return this.position.add(this.size.div(2));
        }

        anchor () {
            // anchors the body
            this.anchored = true;
        }

        unanchor () {
            // unanchors the body
            this.anchored = false;
        }

        getCollisions () {
            // returns an array of the bodies
            // this body is currently colliding with
            return Array.from(this.colliding);
        }

        resetState () {
            // reset body back to rest, and position to zero
            this.velocity = new Vector2(0, 0);
            this.position = new Vector2(0, 0);
            this.angularVelocity = 0;
            this.floored = false;
            this.colliding.clear();
        }

        setTag (tag, value) {
            // for retrieving information
            // about the body later
            this.tags[tag] = value === undefined ? true : value;
        }

        getTag (tag) {
            // returns the value of the associated
            // tag on this body
            return this.tags[tag];
        }

        getVertices () {
            const position = this.getPosition();
            const size = this.getSize();

            return [
                new Vector2(position.x, position.y),
                new Vector2(position.x + size.x, position.y),
                new Vector2(position.x + size.x, position.y + size.y),  
                new Vector2(position.x, position.y + size.y)
            ];
        }
    }
})();