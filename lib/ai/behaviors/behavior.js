import { Ray } from "../../PhysicsJS2D/src/ray.js";
import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Constants } from "../../misc/constants.js";

export const Behavior = (function () {
    return class Behavior {
        // creates a new ai behavior manager
        constructor (host) {
            this.host = host;
            this.active = true;
        }

        // disables the behavior
        disable () {
            this.active = false;
        }

        // enables the behavior
        enable () {
            this.active = true;
        }

        // returns the world
        getWorld () {
            if (!this.host.isSpawned) {
                return null;
            }
            
            return this.host.world;
        }

        // cast a ray in the world
        raycast (origin, direction, distance, filter) {
            if (filter === undefined) {
                filter = (potential) => {
                    return potential.solid || potential.semiSolid;
                }
            }

            const ray = new Ray(origin, direction.scale(distance));

            if (filter) {
                ray.setFilter((potential) => {
                    if (filter !== undefined) {
                        return filter(potential);
                    }

                    return true;
                });
            }

            const world = this.getWorld();
            const physics = world.physics;

            const result = physics.raycast(ray);

            return result.hit;
        }

        // returns the player object,
        // if the host is spawned in
        getPlayer () {
            if (!this.host.isSpawned) {
                return null;
            }

            return this.host.world.player;
        }

        // returns the world tilemap
        getTileMap () {
            if (!this.host.isSpawned) {
                return null;
            }

            return this.host.world.tileMap;
        }

        // causes the host to traverse the
        // world to the given position
        async moveTo (position) {

        }

        // updates the behavior
        update (deltaTime) {
            
        }
    }
})();