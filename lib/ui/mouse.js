import { Vector2 } from "../PhysicsJS2D/src/vector2.js";

export const Mouse = (function () {
    return class Mouse {
        // creates a new mouse object
        constructor (domElement) {
            this.element = domElement;
            this.position = new Vector2(0, 0);
            this.down = false;
            this.up = false;

            this.setupEvents();
        }

        // listens to mouse events on the given element
        setupEvents () {
            this.element.addEventListener("mousemove", (event) => {
                var rect = this.element.getBoundingClientRect();

                var scaleX = this.element.width / rect.width;
                var scaleY = this.element.height / rect.height;

                const mouseX = (event.clientX - rect.left) * scaleX,
                    mouseY = (event.clientY - rect.top) * scaleY;

                this.position.x = mouseX;
                this.position.y = mouseY;
            });

            this.element.addEventListener("mousedown", (e) => {
                if (e.button === 0) {
                    this.down = true;
                }
            });

            this.element.addEventListener("mouseup", (e) => {
                if (e.button === 0) {
                    this.down = false;
                }
            });
        }
    }
})();