import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Event } from "/lib/PhysicsJS2D/src/event.js";
import { Sprite } from "/lib/sprites/sprite.js";
import { UIImage } from "../uiImage.js";
import { UIBase } from "../uiBase.js";
import { UIText } from "../uiText.js";

export const UIPauseScreen = (function () {
    return class UIPauseScreen extends UIBase {
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#041d28",
                transparency: 0.75,
                backgroundEnabled: true,
                visible: false
            });

            this.pausedText = new UIText('PAUSED', {
                positionScale: new Vector2(0.5, 0.25),

                fontSize: 50,
                fontColor: '#ffffff',

                shadow: true,
                shadowColor: '#eeeeee',
                shadowOffset: new Vector2(0, 3)
            });

            this.resumeToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(5),
                positionScale: new Vector2(0.5, 0.7),
                position: new Vector2(30, 0),
                pivot: new Vector2(0, 0.5),
                imageSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(16 * 5, 0),
                clickable: true
            });
            
            this.menuToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(5),
                positionScale: new Vector2(0.5, 0.7),
                position: new Vector2(-30, 0),
                pivot: new Vector2(1, 0.5),
                imageSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(16 * 3, 0),
                clickable: true,
            });

            this.resumeText = new UIText('RESUME', {
                positionScale: new Vector2(0.5, 1.5),
                fontColor: '#ffffff'
            });

            this.menuText = new UIText('MENU', {
                positionScale: new Vector2(0.5, 1.5),
                fontColor: '#ffffff'
            });

            this.resumeText.parentTo(this.resumeToggle);
            this.menuText.parentTo(this.menuToggle);

            this.resumeToggle.parentTo(this);
            this.menuToggle.parentTo(this);
            this.pausedText.parentTo(this);

            this.onResume = new Event();
            this.onQuit = new Event();

            this.resumeToggle.mouseUp.listen(() => {
                this.onResume.trigger();
            });

            this.menuToggle.mouseUp.listen(() => {
                this.onQuit.trigger();
            });
        }
    }
}());