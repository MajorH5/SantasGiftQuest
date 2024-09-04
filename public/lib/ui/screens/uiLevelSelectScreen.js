import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { UILevelPage } from "../features/uiLevelPage.js";
import { Event } from "../../PhysicsJS2D/src/event.js";
import { Sprite } from "../../sprites/sprite.js";
import { Tile } from "../../tiles/tile.js";
import { UIImage } from "../uiImage.js";
import { UIBase } from "../uiBase.js";
import { UIText } from "../uiText.js";
import { Tween } from "../../misc/tween.js";
import { Easing } from "../../misc/easing.js";
import { Levels } from "../../misc/levels.js";
import { Settings } from "../../misc/settings.js";

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

            this.pageLeft.mouseDown.listen(() => {
                this.scrollNextPage(-1);
            });
            this.pageRight.mouseDown.listen(() => {
                this.scrollNextPage(1);
            })

            this.pageContainer = new UIBase({
                size: new Vector2(650, 500),
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.6),
                backgroundColor: "#1a0e1a",
                transparency: 1,
                backgroundEnabled: true,
                borderColor: "#ffffff",
                borderSize: 5,
                clipChildren: true
            });
            this.pageContainer.parentTo(this);

            this.currentPageIndex = 0;
            this.pages = [];
            this.isTweening = false;
            this.stageSelected = new Event();

            this.backgroundGifts = [];
            this.populatedGifts = false;

            this.populateStagePages();
        }

        populateStagePages () {
            this.pageContainer.clearChildren();

            let currentPage = null;

            for (let i = 0; i < Levels.MAX_LEVEL; i++) {
                if (i % 11 === 0) {
                    currentPage = new UILevelPage();
                    currentPage.visible = i === 0;
                    this.pages.push(currentPage);

                    // curry up stage selection events
                    // from the pages
                    currentPage.stageSelected.listen((stageNumber) => {
                        if (this.isTweening || (!Levels.isStageAvailable(stageNumber) && !Settings.DebugModeEnabled)) {
                            return;
                        }
                        
                        this.stageSelected.trigger(stageNumber);
                    });

                    currentPage.parentTo(this.pageContainer);

                }

                currentPage.addStage(i + 1);
            }
        }

        refreshStageStates () {
            for (let i = 0; i < this.pages.length; i++) {
                const page = this.pages[i];

                for (let j = 0; j < page.stageButtons.length; j++) {
                    const stageButton = page.stageButtons[j];

                    const stageNumber = stageButton.value;
                    const isLocked = !Levels.isStageAvailable(stageNumber);

                    stageButton.children.at(-1).visible = isLocked;
                    stageButton.children.at(-2).transparency = isLocked ? 0.5 : 0;
                    stageButton.playMouseDownSound = !isLocked;
                }
            }
        }

        scrollNextPage (direction) {
            if (this.isTweening) {
                return;
            }

            let goalPageIndex = this.currentPageIndex + direction;

            if (goalPageIndex < 0 || goalPageIndex >= this.pages.length) {
                return;
            }

            this.isTweening = true;

            const currentPage = this.pages[this.currentPageIndex];
            const goalPage = this.pages[goalPageIndex];

            goalPage.positionScale = new Vector2(direction, 0);
            goalPage.visible = true;

            const exponential = new Easing(Easing.EasingType.CUBIC, Easing.EasingDirection.OUT)

            new Tween(0.25 * 1000, [[0, direction * -1]], exponential).begin((x) => {
                currentPage.positionScale = new Vector2(x, 0);
                goalPage.positionScale = new Vector2(x + direction, 0);
            }).then(() => {
                currentPage.visible = false;
                this.isTweening = false;
            });

            this.pageLeft.visible = this.pages[goalPageIndex - 1] !== undefined;
            this.pageRight.visible = this.pages[goalPageIndex + 1] !== undefined;

            this.currentPageIndex = goalPageIndex;
        }

        setPageIndex (pageIndex) {
            if (pageIndex < 0 || pageIndex >= this.pages.length || this.currentPageIndex === pageIndex) {
                return;
            }

            const currentPage = this.pages[this.currentPageIndex];
            const goalPage = this.pages[pageIndex];

            goalPage.positionScale = new Vector2(0, 0);
            goalPage.visible = true;

            currentPage.visible = false;

            this.pageLeft.visible = this.pages[pageIndex - 1] !== undefined;
            this.pageRight.visible = this.pages[pageIndex + 1] !== undefined;

            this.currentPageIndex = pageIndex;
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