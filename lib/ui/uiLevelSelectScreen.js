import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Event } from "../PhysicsJS2D/src/event.js";
import { UILevelPage } from "./uiLevelPage.js";
import { UIBase } from "./uiBase.js";
import { UIText } from "./uiText.js";
import { UIImage } from "./uiImage.js";
import { Sprite } from "../sprite.js";
import { Tile } from "../tile.js";

export const UILevelSelectScreen = (function () {
    return class UILevelSelectScreen extends UIBase {
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#073044",
                backgroundEnabled: true,
                transparency: 1,
                visible: false
            });

            this.textContainer = new UIBase({
                backgroundEnabled: true,
                backgroundColor: '#000000',
                sizeScale: new Vector2(1, 0),
                size: new Vector2(0, 80),
                position: new Vector2(0, 110),
                pivot: new Vector2(0, 0.5),
                transparency: 0.45
            });
            this.textContainer.parentTo(this);

            this.selectText = new UIText('SELECT LEVEL', {
                positionScale: new Vector2(0.5, 0.5),
                pivot: new Vector2(0.5, 0.5),
                fontColor: 'white',
                fontSize: 25
            });
            this.selectText.parentTo(this.textContainer);

            this.selectTextHighlight = this.selectText.clone();
            this.selectTextHighlight.parentTo(this.selectText);
            this.selectTextHighlight.positionAbsolute = new Vector2(0, 2);
            this.selectTextHighlight.fontColor = 'black';

            this.pageLeft = new UIText('←', {
                positionScale: new Vector2(0.5, 0.6),
                position: new Vector2(-650/2 + -50, 0),
                size: new Vector2(50, 50),
                pivot: new Vector2(0.5, 0.5),

                shadow: true,
                shadowColor: '#241D97',
                shadowOffset: new Vector2(0, 3),

                fontColor: '#9994EA',
                fontSize: 50,
                clickable: true
            });
            this.pageLeft.parentTo(this);

            this.pageRight = this.pageLeft.clone();
            this.pageRight.text = '→';
            this.pageRight.positionAbsolute = new Vector2(650/2 + 50, 0);
            this.pageRight.sizeAbsolute = new Vector2(50, 50);
            this.pageRight.clickable = true;
            this.pageRight.parentTo(this);

            this.page1 = new UILevelPage();
            this.page1.addStage(1, false);
            this.page1.addStage(2, false);
            this.page1.addStage(3, false);
            this.page1.addStage(4, false);
            this.page1.addStage(5, false);
            this.page1.addStage(6, false);
            this.page1.addStage(7, false);
            this.page1.addStage(8);
            this.page1.addStage(9);
            this.page1.addStage(10);
            this.page1.addStage(11);
            this.page1.parentTo(this);

            this.stageSelected = new Event();

            // curry up stage selection events
            // from the pages
            this.page1.stageSelected.listen((stageNumber) => {
                this.stageSelected.trigger(stageNumber);
            });

            this.backgroundGifts = [];
            this.populatedGifts = false;
        }

        populateBackgroundWithGifts (screenSize) {
            const GIFT_SIZE = 12 * 6;

            const giftsPerRow = Math.ceil(screenSize.x / GIFT_SIZE) + 1;
            const giftsPerColumn = Math.ceil(screenSize.y / GIFT_SIZE) + 1;

            const sizeX = (giftsPerRow * GIFT_SIZE);
            const sizeY = (giftsPerColumn * GIFT_SIZE);
            
            for (let y = 0; y < giftsPerColumn; y++) {
                for (let x = 0; x < giftsPerRow; x++) {
                    const giftSprite = this.createGiftImage();

                    const positionX = (screenSize.x / 2 - sizeX / 2) + (x * GIFT_SIZE);
                    const positionY = (screenSize.y / 2 - sizeY / 2) + (y * GIFT_SIZE);

                    giftSprite.positionAbsolute = new Vector2(positionX, positionY);
                }
            }
        }

        createGiftImage () {
            const possibleGifts = [Tile.RED_GIFT, Tile.GREEN_GIFT, Tile.YELLOW_GIFT];
            const giftSpriteIndex = possibleGifts[Math.floor(Math.random() * possibleGifts.length)];

            const giftSprite = new UIImage(Sprite.IMG_SNOWYTILES, {
                imageRectSize: new Vector2(12, 12),
                imageRectOffset: new Vector2(giftSpriteIndex % 8, Math.floor(giftSpriteIndex / 8)).scale(12),
                size: new Vector2(12, 12).scale(6),
                zIndex: -10,
                imageTransparency: 0.35
            });
            giftSprite.parentTo(this);
            this.backgroundGifts.push(giftSprite);

            return giftSprite;
        }

        scrollBackgroundGifts (screenSize) {
            for (let i = 0; i < this.backgroundGifts.length; i++) {
                const gift = this.backgroundGifts[i];

                const position = gift.positionAbsolute;
                const size = gift.sizeAbsolute;

                const nextPosition = position.add(new Vector2(-0.5, -0.5));

                if (nextPosition.y < -size.y) {
                    nextPosition.y = screenSize.y;
                } else if (nextPosition.x < -size.x) {
                    nextPosition.x = screenSize.x;
                }

                gift.positionAbsolute = nextPosition;
            }
        }

        render (context, screenSize) {
            if (!this.populatedGifts) {
                this.populateBackgroundWithGifts(screenSize);
                this.populatedGifts = true;
            }

            this.scrollBackgroundGifts(screenSize);
            super.render(context, screenSize);
        }
    }
})();