import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Event } from '../PhysicsJS2D/src/event.js'
import { Settings } from "../misc/settings.js";

export const UIBase = (function () {
    return class UIBase {
        constructor (options) {
            this.positionAbsolute = options.position || new Vector2(0, 0);
            this.positionScale = options.positionScale || new Vector2(0, 0);

            this.sizeAbsolute = options.size || new Vector2(0, 0);
            this.sizeScale = options.sizeScale || new Vector2(0, 0);

            this.scale = options.scale || new Vector2(1, 1);
            this.pivot = options.pivot || new Vector2(0, 0);

            this.rotation = options.rotation || 0;
            this.visible = options.visible !== undefined ? options.visible : true;
            this.transparency = options.transparency !== undefined ? options.transparency : 1;

            this.backgroundEnabled = options.backgroundEnabled || false;
            this.backgroundColor = options.backgroundColor || "black";

            this.borderSize = options.borderSize !== undefined ? options.borderSize : 0;
            this.borderColor = options.borderColor || "black";

            this.shadow = options.shadow || false;
            this.shadowColor = options.shadowColor || "black";
            this.shadowBlur = options.shadowBlur || 0;
            this.shadowOffset = options.shadowOffset || new Vector2(0, 0);
            this.clickable = options.clickable || false;
            this.clipChildren = options.clipChildren || false;

            this.zIndex = options.zIndex || 0;

            this.playHoverSound = true;
            this.playMouseDownSound = true;

            this.parent = null;
            this.children = [];

            this.mouseDown = new Event();
            this.mouseUp = new Event();
            this.mouseEnter = new Event();
            this.mouseLeave = new Event();
            this.mouseMove = new Event();

            this.onUpdate = new Event();
            this.onRender = new Event();
        }

        // clones this object
        clone () {
            // TODO: This is not a smart approach as derived classes
            // will be converted to UIBase objects. we could use this.constructor
            // but parameters vary between child classes
            const obj = new UIBase(this);

            for (const child of this.children) {
                const childObj = child.clone();
                childObj.parentTo(obj);
            }

            return obj;
        }

        // updates the uibase object
        update (deltaTime) {
            if (!this.visible) return;
            
            for (let i = 0; i < this.children.length; i++){
                // update each child
                const child = this.children[i];

                if (child.visible) {
                    child.update(deltaTime);
                }
            }

            this.onUpdate.trigger(deltaTime);
        }

        // renders the object to the given context
        // along with all of its children
        render (context, screenSize) {
            if (!this.visible) return;

            const position = this.getScreenPosition(screenSize);
            const size = this.getScreenSize(screenSize);

            context.save();
            context.translate(position.x, position.y);
            context.rotate(this.rotation);
            context.scale(this.scale.x, this.scale.y);

            if (this.shadow) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffset.x;
                context.shadowOffsetY = this.shadowOffset.y;
            }

            context.globalAlpha = this.transparency;
            
            // render the object
            this.renderObject(context, screenSize);
            
            // restore the context
            context.restore();

            context.shadowColor = "black";
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;

            context.save();
            context.rotate(this.rotation);

            if (this.clipChildren) {
                const clippingRect = new Path2D();

                clippingRect.rect(position.x, position.y, size.x, size.y);
                context.clip(clippingRect);
            }

            this.renderChildren(context, screenSize);
            context.restore();

            this.onRender.trigger();
        }

        // renders the children of this object
        renderChildren (context, screenSize) {
            // draw the children
            const children = this.children.sort((a, b) => a.zIndex - b.zIndex);

            for (let i = 0; i < children.length; i++){
                if (children[i].visible){
                    children[i].render(context, screenSize);
                }
            }
        }

        // renders the object to the given context
        renderObject (context, screenSize) {
            if (this.backgroundEnabled){
                const size = this.getScreenSize(screenSize);
                
                context.fillStyle = this.backgroundColor;
                context.fillRect(0, 0, size.x, size.y);
                
            }
            if (this.borderSize > 0){
                const size = this.getScreenSize(screenSize);
                context.strokeStyle = this.borderColor;
                context.lineWidth = this.borderSize;
                context.strokeRect(0, 0, size.x, size.y);
            }
            if (Settings.DebugModeEnabled) {
                const size = this.getScreenSize(screenSize);
                context.strokeStyle = 'red';
                context.lineWidth = 2;
                context.strokeRect(0, 0, size.x, size.y);
            }
        }

        // returns true if the given point is inside the object
        isPointInside (point, screenSize) {
            const position = this.getScreenPosition(screenSize);
            const size = this.getScreenSize(screenSize);

            return point.x >= position.x && point.x <= position.x + size.x &&
                point.y >= position.y && point.y <= position.y + size.y;
        }

        // parents this object to the given object
        parentTo (object) {
            if (object === null) {
                this.unparent();
            }

            if (!(object instanceof UIBase) || object === this) return;

            this.parent = object;
            object.children.push(this);
        }

        // removes the parent for this object
        unparent () {
            const parent = this.parent;

            if (parent === null) {
                return;
            };

            const index = parent.children.indexOf(this);

            if (index > -1){
                parent.children.splice(index, 1);
            }

            this.parent = null;
        }

        // returns the final position of the object
        getScreenPosition (screenSize) {
            // get abs position
            let thisPosition = this.positionAbsolute;

            // add scale position
            if (this.parent !== null) {
                // if there is a parent, use the scale applied to the parent size
                const parentSize = this.parent.getScreenSize(screenSize);
                thisPosition = thisPosition.add(parentSize.multiply(this.positionScale));
            } else {
                // if there is no parent, use the scale applied to screen size
                thisPosition = thisPosition.add(screenSize.multiply(this.positionScale));
            }

            // add pivot position
            const size = this.getScreenSize(screenSize);
            thisPosition = thisPosition.subtract(this.pivot.multiply(size));

            // add parent position
            const parentPosition = this.parent ? this.parent.getScreenPosition(screenSize) : new Vector2(0, 0);

            return parentPosition.add(thisPosition);
        }

        // returns the final size of the object
        getScreenSize (screenSize) {
            // get abs size
            let thisSize = this.sizeAbsolute;

            // add scale size
            if (this.parent !== null) {
                // if there is a parent, use the scale applied to the parent size
                const parentSize = this.parent.getScreenSize(screenSize);
                thisSize = thisSize.add(parentSize.multiply(this.sizeScale));
            } else {
                // if there is no parent, use the scale applied to screen size
                thisSize = thisSize.add(screenSize.multiply(this.sizeScale));
            }

            return thisSize;
        }

        // returns true if the object is visible
        // on the screen
        isVisibleOnScreen (screenSize) {
            const visibilitySet = this.visible;

            // make sure it's rendering and has a parent
            if (!visibilitySet || this.parent === null) {
                return false;
            }

            const position = this.getScreenPosition(screenSize);
            const size = this.getScreenSize(screenSize);

            const withinScreenSpace = position.x + size.x >= 0 && position.x <= screenSize.x &&
                position.y + size.y >= 0 && position.y <= screenSize.y;

            // make sure tis bounding rect is within the
            // borders of the screen
            if (!withinScreenSpace) {
                return false;
            }

            let parent = this.parent;

            // check if any ancestor is hidden or
            // is currently clipping off this child
            while (parent !== null) {
                if (!parent.visible) {
                    return false;
                }

                if (parent.clipChildren) {
                    const parentPosition = parent.getScreenPosition(screenSize);
                    const parentSize = parent.getScreenSize(screenSize);

                    const withinParentSpace = position.x >= parentPosition.x && position.x + size.x <= parentPosition.x + parentSize.x &&
                        position.y >= parentPosition.y && position.y + size.y <= parentPosition.y + parentSize.y;

                    if (!withinParentSpace) {
                        return false;
                    }
                }

                parent = parent.parent;
            }

            return true;
        }
    }
})();