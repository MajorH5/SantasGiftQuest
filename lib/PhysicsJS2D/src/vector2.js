// basic class for 2d vectors
// methods return new vectors, they do not modify the original vector
export const Vector2 = (function () {
    return class Vector2 {
        static get zero () { return new Vector2(0, 0) }
        static get one () { return new Vector2(1, 1) }
        static get xAxis () { return new Vector2(1, 0) }
        static get yAxis () { return new Vector2(0, 1) }

        constructor (x = 0, y = 0) {
            if (typeof x !== 'number') throw new TypeError('new Vector2(): must be a number.');
            if (typeof y !== 'number') throw new TypeError('new Vector2(): must be a number.');
    
            this._x = x;
            this._y = y;
        }
    
        get x () {
            return this._x;
        }
    
        get y () {
            return this._y;
        }

        set x (value) {
            if (typeof value !== 'number') throw new TypeError('Vector2(): x must be a number.');
            this._x = value;
        }

        set y (value ) {
            if (typeof value !== 'number') throw new TypeError('Vector2(): y must be a number.');
            this._y = value;
        }

        add (vector) {
            if (!(vector instanceof Vector2)) throw new TypeError('Vector2.add(): must be a Vector2.');
            return new Vector2(this.x + vector.x, this.y + vector.y);
        }

        subtract (vector) {
            if (!(vector instanceof Vector2)) throw new TypeError('Vector2.subtract(): must be a Vector2.');
            return new Vector2(this.x - vector.x, this.y - vector.y);
        }

        multiply (vector) {
            if (!(vector instanceof Vector2)) throw new TypeError('Vector2.multiply(): must be a Vector2.');
            return new Vector2(this.x * vector.x, this.y * vector.y);
        }

        divide (vector) {
            if (!(vector instanceof Vector2)) throw new TypeError('Vector2.divide(): must be a Vector2.');
            return new Vector2(this.x / vector.x, this.y / vector.y);
        }
        
        dot (vector) {
            if (!(vector instanceof Vector2)) throw new TypeError('Vector2.dot(): must be a Vector2.');
            return this.x * vector.x + this.y * vector.y;
        }

        equals (vector) {
            if (!(vector instanceof Vector2)) throw new TypeError('Vector2.equals(): must be a Vector2.');
            return this.x === vector.x && this.y === vector.y;
        }
        
        scale (scalar) {
            if (typeof scalar !== 'number') throw new TypeError('Vector2.scale(): must be a number.');
            return new Vector2(this.x * scalar, this.y * scalar);
        }

        div (divisor) {
            if (typeof divisor !== 'number') throw new TypeError('Vector2.div(): must be a number.');
            return new Vector2(this.x / divisor, this.y / divisor);
        }

        normalize () {
            const magnitude = this.magnitude();
            return new Vector2(this.x / magnitude, this.y / magnitude);
        }

        magnitude () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        floor () {
            return new Vector2(Math.floor(this.x), Math.floor(this.y));
        }

        ceil () {
            return new Vector2(Math.ceil(this.x), Math.ceil(this.y));
        }

        clone () {
            return new Vector2(this.x, this.y);
        }
    }
})();