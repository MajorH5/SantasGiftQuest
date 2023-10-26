
// class for managing which bodies
// are allowed to collide with each other

export const CollisionGroup = (function () {
    return class CollisionGroup {
        constructor (tagName) {
            this.tag = tagName;
            this.bodies = [];
        }

        clear () {
            // clears the group
            this.bodies = [];
        }

        get () {
            // returns the bodies in the group
            return this.bodies;
        }

        isEmpty () {
            // returns true if there are no bodies
            return this.bodies.length === 0;
        }

        add (body) {
            // adds a body to the group
            if (body.collisionGroup !== this.tag) {
                throw new Error('CollisionGroup.Add: Body does not belong to this group;');
            }
            if (this.bodies.includes(body)) {
                throw new Error('CollisionGroup.Add: Body already in group;');
            }

            this.bodies.push(body);
        }

        remove (body) {
            // removes a body from the group
            const index = this.bodies.indexOf(body);
            
            if (index !== -1) {
                this.bodies.splice(index, 1);
            }
        }
    }
})();