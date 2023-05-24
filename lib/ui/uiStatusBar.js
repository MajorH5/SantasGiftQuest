import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Event } from "../PhysicsJS2D/src/event.js";
import { UIImage } from "./uiImage.js";
import { UIBase } from "./uiBase.js";
import { Sprite } from "../sprite.js";
import { Sounds } from "../sounds.js";

export const UIStatusBar = (function () {
    return class UIStatusBar extends UIBase {
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                zIndex: 2
            });

            this.themeToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(3),
                position: new Vector2(10, 10),
                imageSize: new Vector2(16, 16),
                clickable: true
            });

            this.sfxToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(3),
                position: new Vector2(48 + 20, 10),
                imageSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(16, 0),
                clickable: true
            });

            this.settingsToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(3),
                position: new Vector2(48 * 2 + 30, 10),
                imageSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(16 * 2, 0),
                clickable: true
            });

            this.menuToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(3),
                position: new Vector2(48 * 3 + 42.5, 10),
                imageSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(16 * 3, 0),
                clickable: true,
                visible: false
            });

            this.pauseToggle = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16, 16).scale(3),
                position: new Vector2(48 * 4 + 55, 10),
                imageSize: new Vector2(16, 16),
                imageRectOffset: new Vector2(16 * 4, 0),
                clickable: true,
                visible: false
            });

            this.themeToggle.parentTo(this);
            this.sfxToggle.parentTo(this);
            this.settingsToggle.parentTo(this);
            this.menuToggle.parentTo(this);
            this.pauseToggle.parentTo(this);

            this.onPause = new Event();
            this.onMenu = new Event();
            this.onSettings = new Event();

            this.themeToggle.mouseUp.listen(() => {
                if (this.themeToggle.imageRectOffset.y === 16) {
                    this.themeToggle.imageRectOffset.y = 0;
                    Sounds.unmuteMusic();
                } else {
                    this.themeToggle.imageRectOffset.y = 16;
                    Sounds.muteMusic();
                }
            });
            
            this.sfxToggle.mouseUp.listen(() => {
                if (this.sfxToggle.imageRectOffset.y === 16) {
                    this.sfxToggle.imageRectOffset.y = 0;
                    Sounds.unmuteSfx();
                } else {
                    this.sfxToggle.imageRectOffset.y = 16;
                    Sounds.muteSfx();
                }
            });

            this.settingsToggle.mouseUp.listen(() => {
                this.onSettings.trigger();
            });

            this.menuToggle.mouseUp.listen(() => {
                this.onMenu.trigger();
            });

            this.pauseToggle.mouseUp.listen(() => {
                this.onPause.trigger();
            });
        }
    }
})();