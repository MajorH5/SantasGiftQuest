import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { UIBase } from "./uiBase.js";
import { Sprite } from "../sprite.js";
import { UIImage } from "./uiImage.js";

export const UIGiftIndicators = (function () {
    return class UIGiftIndicators extends UIBase {
        constructor (world) {
            super({
                sizeScale: new Vector2(1, 1),
                zIndex: 3
            });

            const RED = 0, GREEN = 1, YELLOW = 2;

            this.giftsContainer = new UIBase({
                backgroundEnabled: true,
                backgroundColor: 'white',
                transparency: 0.5,

                size: new Vector2(200, 60),
                pivot: new Vector2(0.5, 1),
                position: new Vector2(0, -10),
                positionScale: new Vector2(0.5, 1),
            });

            this.redGift = this.createRemainingIndicator(RED);
            this.greenGift = this.createRemainingIndicator(GREEN);
            this.yellowGift = this.createRemainingIndicator(YELLOW);

            this.giftsContainer.parentTo(this);

            this.world = world;
        }

        update (delta) {
            super.update(delta);

            const tileMap = this.world.tileMap;

            if (tileMap === null) {
                return;
            }

            const rGiftCount = tileMap.getRedGiftRatio();
            const gGiftCount = tileMap.getGreenGiftRatio();
            const yGiftCount = tileMap.getYellowGiftRatio();

            this.updateRemainingIndicator(this.redGift, rGiftCount);
            this.updateRemainingIndicator(this.greenGift, gGiftCount);
            this.updateRemainingIndicator(this.yellowGift, yGiftCount);
        }

        // creates a new gift remaining indication
        createRemainingIndicator (giftType) {
            const backgroundGift = new UIImage(Sprite.IMG_SNOWYTILES, {
                size: new Vector2(60, 60),
                pivot: new Vector2(0, 0.5),
                positionScale: new Vector2(giftType / 3, 0.5),
                position: new Vector2(0, -10),

                imageRectOffset: new Vector2(12 * 3, 12 * 5),
                imageRectSize: new Vector2(12, 12),
            });

            const fillAmmount = new UIImage(Sprite.IMG_SNOWYTILES, {
                pivot: new Vector2(0, 1),
                positionScale: new Vector2(0, 1),
                size: new Vector2(60, 0),

                imageRectOffset: new Vector2(12 * giftType, 72),
                imageRectSize: new Vector2(12, 0)
            });

            fillAmmount.parentTo(backgroundGift);
            backgroundGift.parentTo(this.giftsContainer);

            return fillAmmount
        }

        // updates the gift remaining indication
        updateRemainingIndicator (indicator, percentage) {
            const rectSizeY = 8 * percentage;

            indicator.sizeAbsolute.y = 40 * percentage;
            indicator.imageRectOffset.y = 72 - rectSizeY;
            indicator.imageRectSize.y = rectSizeY;
        }
    }
})();