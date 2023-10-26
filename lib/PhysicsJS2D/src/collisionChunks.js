import { RaycastResult } from './raycastResult.js';
import { Vector2 } from './vector2.js';

export const CollisionChunks = (function () {
    return class CollisionChunks {
        constructor (chunkSize, bounds) {
            this.chunkSize = chunkSize; // size of each chunk
            this.chunks = []; // 2d array of chunks
            this.cache = new WeakMap(); // cache of the chunks an object is in
            this.objects = []; // objects stored in the chunks

            this.bounds = Vector2.zero; // bounds of the chunks
            this.chunksX = 0; // number of chunks in X direction
            this.chunksY = 0; // number of chunks in Y direction

            this.resize(bounds, chunkSize);
        }

        resize (bounds, chunkSize) {
            const objects = this.objects;

            // clear the chunks
            this.clear();
            
            this.bounds = bounds;
            this.chunkSize = chunkSize;

            this.chunksX = Math.ceil(bounds.x / this.chunkSize);
            this.chunksY = Math.ceil(bounds.y / this.chunkSize);

            // create the chunks
            for (let y = 0; y < this.chunksY; y++){
                this.chunks[y] = [];
                for (let x = 0; x < this.chunksX; x++){
                    this.chunks[y][x] = [];
                }
            }

            // reinsert objects back
            for (let i = 0; i < objects.length; i++){
                this.addObject(objects[i]);
            }
        }

        alignPointToChunkCoord (point) {
            // aligns a point to a chunk coordinate
            return point.div(this.chunkSize).floor();
        }

        getChunk (point) {
            // gets the chunk a point is in
            const chunkCoord = this.alignPointToChunkCoord(point);

            // check if the chunk exists
            if (chunkCoord.x < 0 || chunkCoord.x >= this.chunksX) return null;
            if (chunkCoord.y < 0 || chunkCoord.y >= this.chunksY) return null;

            // get the chunk
            return this.chunks[chunkCoord.y][chunkCoord.x];
        }

        getChunkIndex (point) {
            // gets the index of the chunk a point is in
            const chunkCoord = this.alignPointToChunkCoord(point);
            return chunkCoord.y * this.chunksX + chunkCoord.x;
        }

        getObjectsInArea (object) {
            // takes a set of points and combines all objects
            // in the chunks they are in into a single array

            const points = object.getVertices();
            const combined = new Set();
            const collected = [];

            for (let i = 0; i < points.length; i++){
                const point = points[i];
                const chunk = this.getChunk(point);

                if (chunk === null) continue; // no chunk found

                const chunkIndex = this.getChunkIndex(point);

                if (collected.includes(chunkIndex)) continue; // already collected this chunk

                collected.push(chunkIndex);
                
                // add the objects to the combined set
                for (let j = 0; j < chunk.length; j++){
                    const chunkObject = chunk[j];

                    if (chunkObject !== object) {
                        combined.add(chunkObject);
                    }
                }
            }

            return Array.from(combined);
        }

        getPotentialRayHits (ray) {
            // https://gamedev.stackexchange.com/questions/81267/how-do-i-generalise-bresenhams-line-algorithm-to-floating-point-endpoints/182143#182143
            
            const potential = new Set();

            const start = ray.origin,
                end = start.add(ray.direction);

            let x = Math.floor(start.x);
            let y = Math.floor(start.y);
            let diffX = end.x - start.x;
            let diffY = end.y - start.y;
            let stepX = Math.sign(diffX);
            let stepY = Math.sign(diffY);
            
            let xOffset = end.x > start.x ?
                (Math.ceil(start.x) - start.x) :
                (start.x - Math.floor(start.x));
            let yOffset = end.y > start.y ?
                (Math.ceil(start.y) - start.y) :
                (start.y - Math.floor(start.y));

            let angle = Math.atan2(-diffY, diffX);

            let tMaxX = xOffset / Math.cos(angle);
            let tMaxY = yOffset / Math.sin(angle);

            let tDeltaX = 1.0 / Math.cos(angle);
            let tDeltaY = 1.0 / Math.sin(angle);
            
            let manhattanDistance = Math.abs(Math.floor(end.x) - Math.floor(start.x)) +
                Math.abs(Math.floor(end.y) - Math.floor(start.y));
            let chunkAligned = Math.ceil(manhattanDistance / this.chunkSize)

            for (let t = 0; t <= chunkAligned; t++) {
                const chunk = this.getChunk(new Vector2(x, y));
                
                if (chunk !== null) {
                    for (let i = 0; i < chunk.length; i++) {
                        potential.add(chunk[i]);
                    }
                } else {
                    // out of bounds
                    break;
                }

                if (Math.abs(tMaxX) < Math.abs(tMaxY)) {
                    tMaxX += tDeltaX;
                    x += stepX * this.chunkSize;
                } else {
                    tMaxY += tDeltaY;
                    y += stepY * this.chunkSize;
                }
            }

            return Array.from(potential);
        }

        raycast (ray) {
            // returns the first object hit by a ray
            const intersecting = this.getPotentialRayHits(ray);

            for (let i = 0; i < intersecting.length; i++){
                const object = intersecting[i];

                if (ray.canIntersect(object)) {
                    const impactPoint = ray.intersectRect(object);

                    if (impactPoint === null) {
                        continue;
                    }

                    const distance = ray.origin.subtract(impactPoint).magnitude();

                    return new RaycastResult(object, impactPoint, ray.direction, distance);
                }
            }

            return RaycastResult.NONE;
        }

        storeObjectChunks (object, chunks) {
            // stores the chunks an object is in
            this.cache.set(object, chunks);
        }

        getObjectChunks (object) {
            // gets the chunks an object is in
            return this.cache.get(object);
        }

        deleteObjectChunks (object) {
            // deletes the chunks an object is in
            return this.cache.delete(object);
        }

        hasObject (object) {
            // returns true if the object is in the chunks
            return this.cache.has(object);
        }
        
        moveObject (object) {
            // updates the chunks an object is in
            this.removeObject(object);
            this.addObject(object);
        }

        addObject (object) {
            // adds an object to the chunks it falls within
            const inserted = [];

            const x = object.position.x,
                  y = object.position.y;
            const w = object.size.x,
                  h = object.size.y;

            const dx = Math.ceil(w / this.chunkSize),
                    dy = Math.ceil(h / this.chunkSize);

            for (let xStep = x; xStep < x + w; xStep += dx){
                for (let yStep = y; yStep < y + h; yStep += dy){
                    const vertex = new Vector2(xStep, yStep);
                    
                    const chunk = this.getChunk(vertex);

                    if (chunk === null || chunk.includes(object)) continue; // vertex OOB or object already there

                    // add the object to the chunk
                    chunk.push(object);
                    inserted.push(chunk);
                }
            }

            this.objects.push(object);
            this.storeObjectChunks(object, inserted);
        }

        removeObject (object, permanent) {
            // removes an object from the chunks it falls within
            const chunks = this.getObjectChunks(object);

            if (chunks !== undefined) {
                for (let i = 0; i < chunks.length; i++){
                    const chunk = chunks[i];
                    const index = chunk.indexOf(object);
    
                    if (index !== -1) chunk.splice(index, 1);
                }

                if (permanent) {
                    // avoid repeated key creations & deletions
                    this.deleteObjectChunks(object)
                }
            };

            const index = this.objects.indexOf(object);

            if (index !== -1) {
                this.objects.splice(index, 1);
            }
        }

        clear () {
            // clears all objects
            this.chunks = [];
            this.cache = new Map();
            this.objects = [];
            this.bounds = Vector2.zero
            this.chunksX = 0;
            this.chunksY = 0;
        }
    }
})();