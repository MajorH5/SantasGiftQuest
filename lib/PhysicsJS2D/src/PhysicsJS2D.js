import { Body } from './body.js';
import { Vector2 } from './vector2.js';
import { CollisionChunks } from './collisionChunks.js';
import { CollisionGroup } from './collisionGroup.js';

export const Physics = (function () {
    // physics-constants
    const GRAVITY = 1;
    const TERMINAL_VELOCITY = 30;
    const DEFAULT_CHUNK_SIZE = 12 * 5; // size of the collision chunks
    const MIN_VALUE = 1e-5;

    // special-constants
    const SEMI_SOIID_TAG = 'S'; // used to differentiate between semi-solid and solid collisions

    return class Physics {
        constructor (bounds) {
            this.bounds           = bounds || Vector2.zero;  // bounds of the physics world
            this.isActive         = true;    // running state of the engine
            this.gravity          = GRAVITY; // gravitational constant
            this.terminalVelocity = TERMINAL_VELOCITY // max fall velocity before gravity is ignored
            this.chunkSize        = DEFAULT_CHUNK_SIZE // size of the collision chunks

            // non-static bodies in the physics world
            this.bodies = [];
            this.collisionGroups = {}; // collision groups

            // static & non-static bodies in the physics world
            this.bodyChunks = new CollisionChunks(this.chunkSize, this.bounds);
        }

        setBounds (bounds) {
            // set the bounds of the physics world
            this.bounds = bounds;
            this.bodyChunks.resize(bounds, this.chunkSize);
        }

        setChunkSize (chunksSize) {
            // set the size of the collision chunks
            this.chunkSize = chunksSize;
            this.bodyChunks.resize(this.bounds, chunksSize);
        }

        setGravity (gravity) {
            // set the gravitational constant
            this.gravity = gravity;
        }

        setTerminalVelocity (velocity) {
            // set the terminal velocity
            this.terminalVelocity = velocity;
        }

        update (dt) {
            // steps the simulation, updating each bodies position
            // and performs collision checks/resolutions where appropriate
            if (!this.isActive) {
                return;
            }
            
            for (let i = 0; i < this.bodies.length; i++) {
                const body = this.bodies[i];

                if (body.anchored) {
                    // any anchored body's state is considered locked
                    // and will not be updated
                    continue;
                }

                this.process(body, dt);
            }
        }

        process (body, dt) {
            // updates the given body

            // it's important to not let an body's velocity exceed a certain ammount
            // or else it may start phasing through other bodies.
            // my terminal velocity is an arbitrary value specific to my implementation
            if (!body.ignoreGravity && body.velocity.y < this.terminalVelocity) {
                body.velocity.y += this.gravity;
            }

            let previousX = body.position.x, previousY = body.position.y;
            let currentX = previousX + body.velocity.x,
                currentY = previousY + body.velocity.y;

            if (!body.ignoreGravity) {
                // if the body is constrained to the world bounds
                // we need to make sure it doesn't fall out of the world
                
                let exceedsFloorBounds = currentY + body.size.y > this.bounds.y;
                let previousVelocity = body.velocity.y;

                if (body.boundsConstrained) {
                    if (exceedsFloorBounds) {
                        body.velocity.y = 0;
                        currentY = this.bounds.y - body.size.y;
                    }
    
                    if (!body.floored && exceedsFloorBounds) {
                        body.onFloor.trigger(previousVelocity);
                    }
                }

                body.floored = exceedsFloorBounds;
            }

            // cache previous positioning for later collision
            // resolution use
            body.previousPosition = new Vector2(previousX, previousY);

            // apply motion updates to body
            body.position = new Vector2(currentX, currentY);
            body.velocity = body.velocity.scale(body.friction);
            
            body.rotation = (body.rotation + body.angularVelocity) % 360;
            body.angularVelocity *= body.angularFriction;

            if (body.angularVelocity < MIN_VALUE) {
                body.angularVelocity = 0;
            }

            // run basic static aabb collisions
            if (body.hasCollisions) {
                let collidingBodies = this.runCollisions(body);

                if (collidingBodies.length > 0) {
                    this.updateCollisions(body, collidingBodies);
                }

                // remove any collisions that are no longer valid
                const collisions = Array.from(body.colliding);
                
                for (const collision of collisions) {
                    if (!collidingBodies.includes(collision)) {
                        body.colliding.delete(collision);
                        body.collisionEnded.trigger(collision);
                    }
                }
            }

            // finally perform bounds checks
            if (body.position.x < 0) {
                if (body.boundsConstrained) {
                    body.position.x = 0;
                    body.velocity.x = 0;
                }
                body.outOfBounds.trigger(new Vector2(-1, 0));
            }
            
            if (body.position.x + body.size.x > this.bounds.x) {
                if (body.boundsConstrained) {
                    body.position.x = this.bounds.x - body.size.x;
                    body.velocity.x = 0;
                }
                body.outOfBounds.trigger(new Vector2(1, 0));
            }


            if (body.position.y < 0) {
                if (body.boundsConstrained) {
                    body.position.y = 0;
                    body.velocity.y = 0;
                }
                body.outOfBounds.trigger(new Vector2(0, -1));
            }
            
            if (body.position.y + body.size.y > this.bounds.y) {
                if (body.boundsConstrained) {
                    body.position.y = this.bounds.y - body.size.y;
                    body.velocity.y = 0;
                }
                body.outOfBounds.trigger(new Vector2(0, 1));
            }

            if (!body.position.equals(body.previousPosition) || !body.size.equals(body.previousSize)) {
                // update bodyChunks location
                this.bodyChunks.moveObject(body);
            }

            body.previousSize = body.size;

            // all updates complete, inform the body
            body.updated.trigger(dt);
        }

        updateCollisions (body, collisions) {
            // rectangles that are on the same axis in collision
            // should be combined. The resulting rect should be used
            // in resolutions for increased accurary and avoiding
            // slide-clipping issues

            let xAxisMerges = {};
            let yAxisMerges = {};

            for (let i = 0; i < collisions.length; i++) {
                const collidingObject = collisions[i];
                const isNewCollision = !body.colliding.has(collidingObject);

                // fire the collision event, and cache the collision
                if (isNewCollision) {
                    body.colliding.add(collidingObject);
                    body.collision.trigger(collidingObject);
                }

                if (!body.resolveCollisions) {
                    // don't bother with merges or resolutions
                    continue;
                }

                // resolve this!
                if (collidingObject.solid || collidingObject.semiSolid) {
                    let isSemiSolid = collidingObject.semiSolid;
                    let semiSolidTag = isSemiSolid ? SEMI_SOIID_TAG : '';

                    // semisolids and solids should *not* have their rectangles merged
                    // because their collision resolutions are performed differently
                    let xAxisKey = collidingObject.position.x + semiSolidTag;
                    let yAxisKey = collidingObject.position.y + semiSolidTag;

                    if (xAxisMerges[xAxisKey]) {
                        // an existing rect was found on the same x axis
                        xAxisMerges[xAxisKey].push(collidingObject);
                    } else {
                        xAxisMerges[xAxisKey] = [collidingObject];
                    }

                    if (yAxisMerges[yAxisKey]) {
                        // an existing rect was found on the same y axis
                        yAxisMerges[yAxisKey].push(collidingObject);
                    } else {
                        yAxisMerges[yAxisKey] = [collidingObject];
                    }
                }
            }

            if (!body.resolveCollisions) {
                return;
            }

            // combine each x posiiton rect and resolve against it
            for (const xPosition in xAxisMerges) {
                const collidingRects = xAxisMerges[xPosition];
                const isSemiSolid = xPosition.includes(SEMI_SOIID_TAG);

                // if there is only one rect, we don't need to merge
                if (collidingRects.length === 1) {
                    this.resolveRectCollision(body, collidingRects[0]);
                } else {
                    // merge all rects into one
                    let mergedRect = this.mergeRects(collidingRects, isSemiSolid);

                    // resolve against the merged rect
                    this.resolveRectCollision(body, mergedRect);
                }
            }

            // reperform logic for y axis
            for (const yPosition in yAxisMerges) {
                const collidingRects = yAxisMerges[yPosition];
                const isSemiSolid = yPosition.includes(SEMI_SOIID_TAG);
                const mergedRect = this.mergeRects(collidingRects, isSemiSolid);

                // may no longer by colliding after we resolved x axis
                // so perform a quick check to ensure before resolving
                if (this.rectCollision(body, mergedRect)) {
                    this.resolveRectCollision(body, mergedRect);
                }
            }
        }

        rectCollisionRaw (x1, y1, w1, h1, x2, y2, w2, h2) {
            return x1 < x2 + w2 &&
                x1 + w1 > x2 &&
                y1 < y2 + h2 &&
                y1 + h1 > y2;
        }

        rectCollision (body1, body2) {
            return this.rectCollisionRaw(
                body1.position.x, body1.position.y, body1.size.x, body1.size.y,
                body2.position.x, body2.position.y, body2.size.x, body2.size.y
            );
        }

        resolveRectCollision (body1, body2) {
            // performs a static collision resolution between two rectangles
            // the resolving for is only applied to body1. body2 is assumed
            // to be a solid or semisolid body

            let x1 = body1.position.x,
                y1 = body1.position.y,
                w1 = body1.size.x,
                h1 = body1.size.y;

            let x2 = body2.position.x,
                y2 = body2.position.y,
                w2 = body2.size.x,
                h2 = body2.size.y;

            let isSemiSolid = body2.semiSolid;

            let hitUnderHalf = y1 >= y2 + h2 / 2 && y1 < y2 + h2;
            let hitTopHalf = y1 + h1 > y2 && y1 + h1 <= y2 + h2 / 2;
            let hitLeftHalf = x1 + w1 > x2 && x1 + h1 <= x2 + w2 / 2;
            let hitRightHalf = x1 >= x2 + w2 / 2 && x1 < x2 + w2;

            // the following makes alot of assumptions such as body2 remaining in place,
            // or body1 maintaining its size between frames, but for the purposes
            // of this system, bodies are assumed to not wildily change state
            // between frames

            let cameFromAbove = body1.previousPosition.y + h1 <= y2;
            let cameFromBelow = body1.previousPosition.y >= y2 + h2;

            let isComingDown = body1.velocity.y > 0;
            let isComingUp = body1.velocity.y < 0;

            let shouldResolveLanding = isSemiSolid ? (hitTopHalf && isComingDown && cameFromAbove) : (hitTopHalf && isComingDown);
            let shouldResolveBottom = hitUnderHalf && isComingUp && !isSemiSolid;

            let shouldResolveX = !cameFromAbove &&
                !cameFromBelow &&
                !isSemiSolid;

            // xAxis is always resolved first if possible
            if (shouldResolveX) {
                if (hitLeftHalf) {
                    body1.position.x = x2 - w1;
                } else if (hitRightHalf) {
                    body1.position.x = x2 + w2;
                }
                body1.velocity.x = 0;
                return;
            }

            // yAxis is resolved second, with priorty given to landings
            if (shouldResolveLanding) {
                let previousVelocity = body1.velocity.y;
                let wasntOnfloor = !body1.floored;

                body1.floored = true;
                body1.velocity.y = 0;
                body1.position.y = y2 - h1;

                if (wasntOnfloor) {
                    // body just landed on other body
                    body1.onFloor.trigger(previousVelocity);
                }
            } else if (shouldResolveBottom) {
                body1.velocity.y = 0;
                body1.position.y = y2 + h2;
            }
        }

        mergeRects (rects, isSemiSolid) {
            // combines an array of physics bodies
            // and retuens a single body that encompasses all of them

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            for (const rect of rects) {
                minX = Math.min(minX, rect.position.x);
                minY = Math.min(minY, rect.position.y);
                maxX = Math.max(maxX, rect.position.x + rect.size.x);
                maxY = Math.max(maxY, rect.position.y + rect.size.y);
            }

            return new Body({
                position: new Vector2(minX, minY),
                size: new Vector2(maxX - minX, maxY - minY),
                semiSolid: isSemiSolid,
            });
        }

        runCollisions (body) {
            // determines all bodies that are colliding
            // with the given body
            const collidables = this.getCollisionBodiesFor(body);
            const bodyCollisions = [];
            
            for (const collidable of collidables) {
                // preliminary filter checks before doing a full collision check
                if (collidable === body) {
                    // avoid collisions against this
                    continue;
                }

                if (!collidable.hasCollisions) {
                    // avoid collisions against bodies that dont have collisions
                    continue;
                }

                if (!this.isPossibleCollision(body, collidable)) {
                    // avoid collisions against bodies that are too far away
                    continue;
                }

                if (this.rectCollision(body, collidable)) {
                    bodyCollisions.push(collidable);
                }
            }

            return bodyCollisions;
        }

        isPossibleCollision (body1, body2) {
            // if the distance between the two bodies
            // is less than the greatest size on that respective axis
            // then a collision is possible
            let xMax = Math.max(body1.size.x, body2.size.x),
                yMax = Math.max(body1.size.y, body2.size.y);

            let dx = Math.abs(body1.position.x - body2.position.x),
                dy = Math.abs(body1.position.y - body2.position.y);

            return dx < xMax && dy < yMax;
        }

        getCollisionBodiesFor (body) {
            // returns all other bodies to check for collisions against
            // for the given body

            // search surrounding area for bodies to collide with
            const nearby = this.bodyChunks.getObjectsInArea(body);
            
            if (body.collidesWith === null) {
                // body wants to collide with everything
                return nearby;
            } else {
                const objectCollisionGroup = this.getCollisionGroup(body.collidesWith);
                
                if (objectCollisionGroup !== null) {
                    // body only wants to collide with these
                    const groupObjects = objectCollisionGroup.get();
                    return nearby.filter((obj) => groupObjects.includes(obj));
                } else {
                    // this group was not found
                    return [];
                }
            }
        }

        removeCollisonGroup (tagName) {
            // removes an existing collision group
            let group = this.getCollisionGroup(tagName);

            if (group !== null) {
                delete this.collisionGroups[tagName];
            }
        }

        createCollisionGroup (tagName) {
            // creates a new collision group
            let group = new CollisionGroup(tagName);
            this.collisionGroups[tagName] = group;
            return group;
        }

        getCollisionGroup (tagName) {
            // returns a collision group by its tag
            if (tagName in this.collisionGroups) {
                return this.collisionGroups[tagName];
            }

            return null;
        }

        clearObjects () {
            // removes all bodies from the physics system
            this.bodies = [];
            this.bodyChunks.clear();

            for (const key in this.collisionGroups) {
                this.collisionGroups[key].clear();
            }
        }

        hasObject (body) {
            // checks if the given body is in the physics system
            return this.bodies.includes(body) || this.bodyChunks.hasObject(body);
        }

        addBody (body, isStatic) {
            // static bodies are expected to remain as are,
            // to avoid unnecessary iterations, they are not stored
            // with the other bodies, only in the bodyChunks
            if (!isStatic) {
                this.bodies.push(body);
            }
            
            this.bodyChunks.addObject(body, isStatic);

            if (body.collisionGroup !== null) {
                // add this body to its collision group
                let group = this.getCollisionGroup(body.collisionGroup);

                if (group === null) {
                    group = this.createCollisionGroup(body.collisionGroup);
                }

                group.add(body);
            }
        }

        removeBody (body) {
            // removes a body from the physics system
            
            if (!this.hasObject(body)) {
                return;
            }

            const bodiesIndex = this.bodies.indexOf(body);

            if (bodiesIndex !== -1) {
                this.bodies.splice(bodiesIndex, 1);
            }
            
            this.bodyChunks.removeObject(body, true);

            if (body.collisionGroup !== null) {
                // remove this body from its collision group
                let group = this.getCollisionGroup(body.collisionGroup);

                if (group !== null) {
                    group.remove(body);

                    if (group.isEmpty()){
                        this.removeCollisonGroup(body.collisionGroup);
                    }
                }
            }
        }

        raycast (ray) {
            // cast a ray against the physics system
            return this.bodyChunks.raycast(ray);
        }

        pause () {
            // pauses the simulation
            this.isActive = false;
        }

        resume () {
            // resumes the simulation
            this.isActive = true;
        }
    }
})();