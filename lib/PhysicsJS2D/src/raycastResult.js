export const RaycastResult = (function () {
    return class RaycastResult {
        constructor (hit, point, normal, distance) {
            this.hit = hit;
            this.point = point;
            this.normal = normal;
            this.distance = distance;
        }

        static get NONE () {
            return new RaycastResult(null, null, null, Infinity);
        }
    }
})();