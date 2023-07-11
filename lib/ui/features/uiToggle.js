import { Vector2 } from '/lib/PhysicsJS2D/src/vector2.js';
import { Event } from '/lib/PhysicsJS2D/src/event.js';
import { Sprite } from '/lib/sprites/sprite.js';
import { UIImage } from '../uiImage.js';

export const UIToggle = (function () {
    return class UIToggle extends UIImage {
        constructor (defaultValue, options) {
            super(Sprite.IMG_ICONS, {
                imageRectSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(defaultValue ? (3 * 16) : (2 * 16), 16 * 1),
                clickable: true,
                ...options
            });

            this.mouseUp.listen(() => this.toggle());
            this.onToggle = new Event();

            this.isToggled = defaultValue;
        }

        // toggles this
        toggle () {
            this.isToggled = !this.isToggled;
            this.imageRectOffset.x = this.isToggled ? 3 * 16 : 2 * 16;
            this.onToggle.trigger(this.isToggled);
        }

    }
})();