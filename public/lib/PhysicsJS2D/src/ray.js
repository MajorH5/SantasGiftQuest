import { Vector2 } from "./vector2.js";

export const Ray = (function () {
    return class Ray {
        static MAX_DISTANCE = 1000;
        
        constructor (origin, direction) {
            this.origin = origin.clone();
            this.direction = direction.clone();
            this.filterFunction = null;
            this.ignoreList = [];

            this.start = this.origin;
            this.end = this.origin.add(this.direction);
        }

        ignore (bodyOrList) {
            // accepts a body or list of bodies to ignore

            if (Array.isArray(bodyOrList)) {
                this.ignoreList.push(...bodyOrList);
            } else {
                this.ignoreList.push(bodyOrList);
            }
        }

        unignore (bodyOrList) {
            // accepts a body or list of bodies to unignore

            if (Array.isArray(bodyOrList)) {
                bodyOrList.forEach(body => {
                    const index = this.ignoreList.indexOf(body);
                    if (index !== -1) {
                        this.ignoreList.splice(index, 1);
                    }
                });
            } else {
                const index = this.ignoreList.indexOf(bodyOrList);
                if (index !== -1) {
                    this.ignoreList.splice(index, 1);
                }
            }
        }

        canIntersect (body) {
            // returns true if the ray can intersect the body
            // based on the filter function

            let canIntersect = true;

            if (this.filterFunction) {
                // only allow intersection if the filter function allows
                canIntersect = canIntersect && this.filterFunction(body);
            }

            if (this.ignoreList.length > 0 && canIntersect) {
                // skip intersection if the body is in the ignore list
                canIntersect = canIntersect && !this.ignoreList.includes(body);
            }

            return canIntersect;
        }

        setFilter (filterFunction) {
            // accepts a function that will be used to determine
            // whether the ray can intersect a body

            this.filterFunction = filterFunction;
        }

        intersectRect (rect) {
            // casts a ray in 2d space against a rectangle
            // and returns the point of intersection

            const position = rect.position;
            const size = rect.size;

            const x = this.origin.x;
            const y = this.origin.y;

            const dx = this.origin.x + this.direction.x;
            const dy = this.origin.y + this.direction.y;

            if (dx == 0 && dy == 0) {
                return null;
            }

            // check for intersection against each side
            const top = this.intersectLine(position, new Vector2(position.x + size.x, position.y));
            const bottom = this.intersectLine(new Vector2(position.x, position.y + size.y),
                new Vector2(position.x + size.x, position.y + size.y));
            const left = this.intersectLine(position, new Vector2(position.x, position.y + size.y));
            const right = this.intersectLine(new Vector2(position.x + size.x, position.y),
                new Vector2(position.x + size.x, position.y + size.y));

            if (top || bottom || left || right) {
                const points = [top, bottom, left, right].filter(point => point);
                let closest = points[0];
                let closestDistance = Infinity;

                points.forEach(point => {
                    const distance = point.subtract(this.origin).magnitude();
                    if (distance < closestDistance) {
                        closest = point;
                        closestDistance = distance;
                    }
                });

                return closest;
            }
            
            return null;
        }

        intersectLine (start, end) {
            // casts a ray in 2d space against a line
            // and returns the point of intersection

            const x1 = start.x;
            const y1 = start.y;
            const x2 = end.x;
            const y2 = end.y;

            const x3 = this.origin.x;
            const y3 = this.origin.y;
            const x4 = this.origin.x + this.direction.x;
            const y4 = this.origin.y + this.direction.y;

            const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

            if (denominator == 0) {
                return null;
            }

            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

            if (t > 0 && t < 1 && u > 0 && u < 1) {
                const x = x1 + t * (x2 - x1);
                const y = y1 + t * (y2 - y1);
                return new Vector2(x, y);
            }

            return null;
        }
    }
})();