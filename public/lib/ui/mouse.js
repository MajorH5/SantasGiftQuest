import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Event } from "../PhysicsJS2D/src/event.js";
import { Constants } from "../misc/constants.js";

export const Mouse = (function () {
    return class Mouse {
        // creates a new mouse object
        constructor (domElement, touch = null) {
            this.element = domElement;
            this.position = new Vector2(0, 0);
            this.lastPosition = new Vector2(0, 0);

            this.lastDown = false;
            this.down = false;
            this.up = false;
            this.identifier = null;
            this.scroll = 0;

            this.heldObjects = new Map();
            this.insideObjects = new Map();

            this.mouseDown = new Event();
            this.mouseUp = new Event();
            this.mouseMoved = new Event();

            if (touch !== null) {
                this.identifier = touch.identifier;
                this.down = true;
                this.position.x = touch.clientX;
                this.position.y = touch.clientY;
            }

            this.setupEvents();
        }
        
        // stores the object in the mouse cache
        // of objects that are being held
        hold (object) {
            this.heldObjects.set(object, true);
        }

        // removes the object from the mouse cache
        // of objects that are being held
        release (object) {
            this.heldObjects.delete(object);
        }

        // stores objects that are inside the mouse
        enter (object) {
            this.insideObjects.set(object, true);
        }

        // removes objects that are inside the mouse
        exit (object) {
            this.insideObjects.delete(object);
        }

        // returns true if the mouse is holding the object
        isHolding (object) {
            return this.heldObjects.has(object);
        }

        // returns true if the mouse is inside the object
        isInside (object) {
            return this.insideObjects.has(object);
        }

        // updates the mouse
        update () {
            this.lastPosition = this.position.clone();
            this.lastDown = this.down;
            this.scroll = 0;
        }

        // sets the current scrolling direction for the mouse
        setScroll (direction) {
            this.scroll = direction;
        }

        // returns the current scrolling direction for the mouse
        getScroll () {
            return this.scroll;
        }

        // normalizes the given position relative to
        // the canvas scale
        normalizePosition (x, y) {
            var rect = this.element.getBoundingClientRect();
    
            var scaleX = this.element.width / rect.width;
            var scaleY = this.element.height / rect.height;

            const mouseX = (x - rect.left) * scaleX,
                mouseY = (y - rect.top) * scaleY;
            
            return new Vector2(mouseX, mouseY);
        }

        // listens to mouse events on the given element
        setupEvents () {
            if (Constants.MOBILE_ENVIRONMENT) {
                document.addEventListener('touchmove', (event) => {
                    const changedTouched = event.changedTouches;

                    for (let i = 0; i < changedTouched.length; i++) {
                        const touch = changedTouched[i];

                        if (touch.identifier !== this.identifier) {
                            continue;
                        }

                        const position = this.normalizePosition(touch.clientX, touch.clientY);
                        
                        this.position.x = position.x;
                        this.position.y = position.y;
                    }
                    
                    this.mouseMoved.trigger(this.position, this);
                });
            } else {
                this.element.addEventListener("mousemove", (event) => {
                    const position = this.normalizePosition(event.clientX, event.clientY);
    
                    this.position.x = position.x;
                    this.position.y = position.y;

                    this.mouseMoved.trigger(this.position, this);
                });
                
                this.element.addEventListener("mousedown", (e) => {
                    if (e.button === 0) {
                        this.down = true;
                    }

                    this.mouseDown.trigger(this.position, this);
                });
    
                this.element.addEventListener("mouseup", (e) => {
                    if (e.button === 0) {
                        this.down = false;
                    }

                    this.mouseUp.trigger(this.position, this);
                });
            }
        }
    }
})();