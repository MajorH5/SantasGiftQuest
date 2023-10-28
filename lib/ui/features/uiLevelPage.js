import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Event } from "../../PhysicsJS2D/src/event.js";
import { Sprite } from "../../sprites/sprite.js";
import { Sounds } from "../../sounds/sounds.js";
import { UIImage } from "../uiImage.js";
import { UIBase } from "../uiBase.js";
import { Levels } from "../../misc/levels.js";

export const UILevelPage = (function () {
    return class UILevelPage extends UIBase {
        static NUM_ICON_INDEX_START = 24;
        static NUM_ICON_INDEX_COLUMNS = 6;
        constructor (options = {}) {
            super({
                size: new Vector2(650, 500),
                ...options
            });

            this.stageButtons = [];
            this.stageSelected = new Event();
        }

        organizeButonLayout () {
            const padding = 100;

            let currentX = 0;
            let currentY = 0;

            for (let i = 0; i < this.stageButtons.length; i++) {
                const stageButton = this.stageButtons[i];
                const nextButtonSize = this.stageButtons[i + 1] ? this.stageButtons[i + 1].sizeAbsolute : new Vector2(0, 0);

                stageButton.positionAbsolute = new Vector2(currentX, currentY);
                currentX += stageButton.sizeAbsolute.x + padding;

                if (currentX + nextButtonSize.x > this.sizeAbsolute.x) {
                    currentX = 0;
                    currentY += stageButton.sizeAbsolute.y + padding;
                }
            }
        }

        addStage (stageNumber) {
            const isLocked = !Levels.isStageAvailable(stageNumber);
            const isBossStage = Levels.isBossStage(stageNumber);
            const buttonScale = 4;

            const stageNumberString = stageNumber.toString();
            const stageContainer = new UIBase({
                pivot: new Vector2(-0.5, -0.5),
                size: new Vector2(16 * stageNumberString.length, 16).scale(buttonScale),
                clickable: true
            });
            stageContainer.value = stageNumber;

            stageContainer.mouseUp.listen(() => {
                this.stageSelected.trigger(stageNumber);
            });

            for (let i = 0; i < stageNumberString.length; i++) {
                const spriteIndex = UILevelPage.NUM_ICON_INDEX_START + parseInt(stageNumberString[i]);
                const imageRectOffset = new Vector2(spriteIndex % UILevelPage.NUM_ICON_INDEX_COLUMNS,
                    Math.floor(spriteIndex / UILevelPage.NUM_ICON_INDEX_COLUMNS)).scale(16);
                
                const stageNumImage = new UIImage(Sprite.IMG_ICONS, {
                    imageRectSize: new Vector2(16, 16),
                    imageRectOffset: imageRectOffset,
                    position: new Vector2(16 * i, 0).scale(buttonScale),
                    size: new Vector2(16, 16).scale(buttonScale)
                });

                stageNumImage.parentTo(stageContainer);
            }

            const dim = new UIBase({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#000000",
                backgroundEnabled: true,
                transparency: isLocked ? 0.5 : 0
            });
            dim.parentTo(stageContainer);

            const coverIcon = new UIImage(Sprite.IMG_ICONS, {
                imageRectSize: new Vector2(16, 16),
                imageRectOffset: isBossStage ? new Vector2(5 - (0.5 / 16), 1).scale(16) : new Vector2(4, 1).scale(16),
                size: new Vector2(16, 16).scale(buttonScale),
                positionScale: new Vector2(0.5, 0.5),
                pivot: new Vector2(0.5, 0.5),
                visible: isLocked
            });
            coverIcon.parentTo(stageContainer);

            stageContainer.parentTo(this);
            this.stageButtons.push(stageContainer);

            this.organizeButonLayout();
        }

        update (deltaTime) {
            super.update(deltaTime);

            if (!Sounds.isThemePlayingType(Sounds.SND_TITLE_THEME)) {
                Sounds.playTheme(Sounds.SND_TITLE_THEME);
            }
        }
    }
})();