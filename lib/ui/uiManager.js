import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Constants } from "../misc/constants.js";
import { Sounds } from "../sounds/sounds.js";
import { Mouse } from "./mouse.js";

export const UIManager = (function () {
    return class UIManager {
        // creates a new uimanager object
        constructor (canvas, setMouseCursor = false) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
            this.objects = [];
            this.mouses = [];
            this.setMouseCursor = setMouseCursor;

            // holds mouse states for each ui object
            // to know when to trigger mouse events
            this.mouseState = {
                mouseHolding: new Map(),
                mouseInside: new Map()
            };

            document.addEventListener('touchstart', (event) => {
                const changedTouched = event.changedTouches;

                for (let i = 0; i < changedTouched.length; i++) {
                    const touch = changedTouched[i];
                    const mouse = new Mouse(canvas, touch);

                    this.mouses.push(mouse);
                }
            });

            document.addEventListener('touchend', (event) => {
                const changedTouched = event.changedTouches;

                for (let i = 0; i < changedTouched.length; i++) {
                    const touch = changedTouched[i];
                    const mouse = this.mouses.find(mouse => mouse.identifier === touch.identifier);

                    if (mouse !== undefined) {
                        const held = Array.from(mouse.heldObjects.keys());
                        const inside = Array.from(mouse.insideObjects.keys());

                        for (let i = 0; i < held.length; i++) {
                            const object = held[i];

                            object.mouseUp.trigger(mouse.position);
                        }

                        for (let i = 0; i < inside.length; i++) {
                            const object = inside[i];

                            object.mouseLeave.trigger(mouse.position);
                        }

                        this.mouses.splice(this.mouses.indexOf(mouse), 1);
                    }
                }
            });

            this.mouses.push(new Mouse(canvas));
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

                for (let i = 0; i < this.mouses.length; i++) {
                    const mouse = this.mouses[i];
                    const isPointer = this.updateMouseEvents(object, mouse);

                    if (isPointer) cursor = "pointer";
                }
            }
            
            for (let i = 0; i < this.mouses.length; i++) {
                const mouse = this.mouses[i];

                mouse.update();
            }

            this.setCursor(cursor);
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
        updateMouseEvents (object, mouse) {
            const screenSize = new Vector2(this.canvas.width, this.canvas.height);
            
            const mousePosition = mouse.position;
            const mouseDown = mouse.down;
            
            const mouseIsInside = object.isPointInside(mousePosition, screenSize);
            const mouseWasMoved = !mouse.lastPosition.equals(mousePosition);

            let isOverClickable = false;

            if (mouseIsInside) {
                const visibleOnScreen = object.isVisibleOnScreen(screenSize);

                if (object.clickable && visibleOnScreen) isOverClickable = true;

                if (mouseDown && !mouse.lastDown && !mouse.isHolding(object)) {
                    // fire mouse down event
                    object.mouseDown.trigger(mousePosition);
                    mouse.hold(object);

                    if (object.clickable && object.playMouseDownSound) {
                        Sounds.playSfx(Sounds.SND_BUTTON_PRESS);
                    }
                }

                
                if (!mouse.isInside(object) && visibleOnScreen) {
                    // fire mouse enter event
                    object.mouseEnter.trigger(mousePosition);
                    mouse.enter(object);
                    
                    if (object.clickable && object.playHoverSound && mouseWasMoved) {
                        Sounds.playSfx(Sounds.SND_BUTTON_SELECT);
                    }
                }

                if (mouseWasMoved && visibleOnScreen) {
                    // fire mouse move event
                    object.mouseMove.trigger(mousePosition);
                }
            } else {
                if (mouse.isInside(object)) {
                    // fire mouse leave event
                    object.mouseLeave.trigger(mousePosition);
                    mouse.exit(object);
                }
            }

            if (!mouseDown && mouse.isHolding(object)) {
                // fire mouse up event
                if (mouseIsInside) {
                    object.mouseUp.trigger(mousePosition);
                }
                this.releaseMouseHolding(object);    
            }

            for (let i = 0; i < object.children.length; i++){
                const child = object.children[i];
                let clickable = this.updateMouseEvents(child, mouse);

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
            this.mouses.forEach((mouse) => {
                mouse.release(object);

                if (releaseChildren) {
                    for (let i = 0; i < object.children.length; i++) {
                        this.releaseMouseHolding(object.children[i]);
                    }
                }
            });
        }

        // releases the mouse inside state
        // for the given object
        releaseMouseInside (object, releaseChildren) {
            this.mouses.forEach((mouse) => {
                mouse.exit(object);

                if (releaseChildren) {
                    for (let i = 0; i < object.children.length; i++) {
                        this.releaseMouseHolding(object.children[i]);
                    }
                }
            });
        }
    }
})();