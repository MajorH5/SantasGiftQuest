import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Sounds } from "/lib/sounds/sounds.js";
import { Mouse } from "./mouse.js";

export const UIManager = (function () {
    return class UIManager {
        // creates a new uimanager object
        constructor (canvas, setMouseCursor = false) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.objects = [];

            this.mouse = new Mouse(canvas);

            this.lastMousePosition = this.mouse.position.clone();
            this.lastMouseDown = this.mouse.down;
            this.setMouseCursor = setMouseCursor;

            // holds mouse states for each ui object
            // to know when to trigger mouse events
            this.mouseState = {
                mouseHolding: new Map(),
                mouseInside: new Map()
            };
        }

        // updates the ui manager and all ui objects
        update (deltaTime) {
            let cursor = "default";

            for (let i = 0; i < this.objects.length; i++){
                const object = this.objects[i];

                if (!object.visible) {
                    continue;
                }
                
                object.update(deltaTime);

                const isPointer = this.updateMouseEvents(object);

                if (isPointer) cursor = "pointer";
            }
            
            this.setCursor(cursor);
            this.lastMouseDown = this.mouse.down;
            this.lastMousePosition = this.mouse.position.clone();
        }

        // renders all the ui objects within
        // within this manager
        render (scale) {
            const screenSize = new Vector2(this.canvas.width, this.canvas.height);
            const objects = this.objects.sort((a, b) => a.zIndex - b.zIndex);

            for (let i = 0; i < objects.length; i++){
                const object = objects[i];

                if (object.visible) {
                    object.render(this.context, screenSize, scale);
                }
            }
        }

        // updates all mouse events for the
        // given object
        updateMouseEvents (object) {
            const screenSize = new Vector2(this.canvas.width, this.canvas.height);
            
            const mousePosition = this.mouse.position;
            const mouseDown = this.mouse.down;
            
            const mouseIsInside = object.isPointInside(mousePosition, screenSize);
            const mouseWasMoved = !this.lastMousePosition.equals(mousePosition);

            let isOverClickable = false;

            if (mouseIsInside) {
                const visibleOnScreen = object.isVisibleOnScreen(screenSize);

                if (object.clickable && visibleOnScreen) isOverClickable = true;

                const parent = object.parent;

                if (mouseDown && !this.lastMouseDown && !this.getMouseHolding(object) && visibleOnScreen) {
                    // fire mouse down event
                    object.mouseDown.trigger(mousePosition);
                    this.setMouseHolding(object);

                    if (object.clickable && object.playMouseDownSound) {
                        Sounds.playSfx(Sounds.SND_BUTTON_PRESS);
                    }
                }

                if (!this.getMouseInside(object) && visibleOnScreen) {
                    // fire mouse enter event
                    object.mouseEnter.trigger(mousePosition);
                    this.setMouseInside(object);

                    if (object.clickable && object.playHoverSound && mouseWasMoved) {
                        Sounds.playSfx(Sounds.SND_BUTTON_SELECT);
                    }
                }

                if (mouseWasMoved && visibleOnScreen) {
                    // fire mouse move event
                    object.mouseMove.trigger(mousePosition);
                }
            } else {
                if (this.getMouseInside(object)) {
                    // fire mouse leave event
                    object.mouseLeave.trigger(mousePosition);
                    this.releaseMouseInside(object);
                }
            }

            if (!mouseDown && this.getMouseHolding(object)) {
                // fire mouse up event
                if (mouseIsInside) {
                    object.mouseUp.trigger(mousePosition);
                }
                this.releaseMouseHolding(object);    
            }

            for (let i = 0; i < object.children.length; i++){
                const child = object.children[i];
                let clickable = this.updateMouseEvents(child);

                if (clickable) isOverClickable = true;
            }

            return isOverClickable;
        }

        // sets the current cursor
        setCursor (cursor) {
            if (!this.setMouseCursor) {
                return;
            }
            
            this.canvas.style.cursor = cursor;
        }

        // adds the given object to the ui manager
        addObject (object) {
            this.objects.push(object);
        }

        // removes the given object from the ui manager
        removeObject (object) {
            const index = this.objects.indexOf(object);

            if (index > -1){
                this.objects.splice(index, 1);
            }

            this.releaseMouseHolding(object, true);
            this.releaseMouseInside(object, true);
        }

        // clears all objects from the ui manager
        clearObjects () {
            this.objects = [];
        }

        // releases the mouse holding state
        // for the given object
        releaseMouseHolding (object, releaseChildren) {
            this.mouseState.mouseHolding.delete(object);

            if (releaseChildren) {
                for (let i = 0; i < object.children.length; i++){
                    const child = object.children[i];
                    this.releaseMouseHolding(child);
                }
            }
        }

        // releases the mouse inside state
        // for the given object
        releaseMouseInside (object, releaseChildren) {
            this.mouseState.mouseInside.delete(object);

            if (releaseChildren) {
                for (let i = 0; i < object.children.length; i++){
                    const child = object.children[i];
                    this.releaseMouseInside(child);
                }
            }
        }

        // sets the mouse holding state
        // for the given object
        setMouseHolding (object, state) {
            this.mouseState.mouseHolding.set(object, true);
        }

        // sets the mouse inside state
        // for the given object
        setMouseInside (object, state) {
            this.mouseState.mouseInside.set(object, true);
        }
        
        // returns the mouse holding state
        // for the given object
        getMouseHolding (object) {
            return this.mouseState.mouseHolding.get(object) ? true : false;
        }

        // returns the mouse inside state
        // for the given object
        getMouseInside (object) {
            return this.mouseState.mouseInside.get(object) ? true : false;
        }
    }
})();