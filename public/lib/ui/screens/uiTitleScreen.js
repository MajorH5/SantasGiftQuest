import { Entity } from "../../world/gameobjects/entities/entity.js";
import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Event } from "../../PhysicsJS2D/src/event.js";
import { Settings } from "../../misc/settings.js";
import { Sprite } from "../../sprites/sprite.js";
import { Version } from "../../misc/version.js";
import { Sounds } from "../../sounds/sounds.js";
import { Levels } from "../../misc/levels.js";
import { World } from "../../world/world.js";
import { UIImage } from "../uiImage.js";
import { UIText } from "../uiText.js";
import { UIBase } from "../uiBase.js";

export const UITitleScreen = (function () {
    return class UITitleScreen extends UIBase {
        // creates a new UI title screen object
        constructor (canvas) {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#041d28",
                transparency: 0.75,
                backgroundEnabled: true
            });

            this.headerText = new UIText("SANTA'S GIFT\nQUEST", {
                pivot: new Vector2(0.5, 0),
                positionScale: new Vector2(0.5, 0.2),

                size: new Vector2(500, 90),

                fontSize: 40,
                fontColor: 'white',
                textYAlignment: 'top',
                textXAlignment: 'center',

                shadow: true,
                shadowColor: '#9994ea',
                shadowOffset: new Vector2(0, 5),
            });

            let timesClicked = 0;
            this.versionText = new UIText(Version.version, {
                pivot: new Vector2(0.5, 1),
                size: new Vector2(100, 50),
                positionScale: new Vector2(0.5, 1),

                fontSize: 10,
                fontColor: 'white',
                textTransparency: 0.5,
                clickable: true
            });
            this.versionText.mouseUp.listen(() => {
                timesClicked++;

                if (timesClicked >= 10 || Settings.DebugModeEnabled) {
                    timesClicked = 0;
                    Settings.DebugModeEnabled = !Settings.DebugModeEnabled;
                }
            })
            this.versionText.playHoverSound = false;

            this.buttonContainer = new UIBase({
                positionScale: new Vector2(0.5, 0.5),
                position: new Vector2(0, 150),
                pivot: new Vector2(0.5, 0.5),
                sizeScale: new Vector2(0.5, 0.25),

                backgroundColor: 'white'
            });

            this.leftSelector = new UIText('→', {
                pivot: new Vector2(1, 0.5),
                position: new Vector2(-30, 0),
                positionScale: new Vector2(0, 0.5),

                size: new Vector2(50, 50),

                shadow: true,
                shadowColor: '#241D97',
                shadowOffset: new Vector2(0, 3),

                fontColor: '#9994EA',
                fontSize: 40
            });

            this.rightSelector = new UIText('←', {
                pivot: new Vector2(0, 0.5),
                position: new Vector2(30, 0),
                positionScale: new Vector2(1, 0.5),

                size: new Vector2(50, 50),

                shadow: true,
                shadowColor: '#241D97',
                shadowOffset: new Vector2(0, 3),

                fontColor: '#9994EA',
                fontSize: 40
            });

            this.copyright = new UIText('Copyright © 2024 Habib Aina. All rights reserved.', {
                font: 'Arial',
                fontSize: 10,
                fontColor: 'white',
                textTransparency: 0.5,
                pivot: new Vector2(0, 1),
                positionScale: new Vector2(0, 1),
                size: new Vector2(240, 30)
            });

            this.playButton = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16 * 3, 16).scale(3),
                positionScale: new Vector2(0.5, 0),
                pivot: new Vector2(0.5, 0),
                imageRectSize: new Vector2(16 * 3, 16),
                imageRectOffset: new Vector2(0, 32),
                clickable: true,
            });
            
            this.creditsButton = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16 * 4 + 8, 16).scale(3),
                position: new Vector2(0, (16 * 3 + 16) * 2),
                positionScale: new Vector2(0.5, 0),
                pivot: new Vector2(0.5, 0),
                imageRectSize: new Vector2(16 * 4 + 8, 16),
                imageRectOffset: new Vector2(0, 48),
                clickable: true,
            });

            this.editorButton = new UIImage(Sprite.IMG_ICONS, {
                size: new Vector2(16 * 3 + 14, 16).scale(3),
                pivot: new Vector2(0.5, 0),
                position: new Vector2(0, 16 * 3 + 16),
                positionScale: new Vector2(0.5, 0),
                imageRectSize: new Vector2(16 * 3 + 14, 16),
                imageRectOffset: new Vector2(0, 6 * 16),
                clickable: true,
            })

            this.bindButtonEvents(this.playButton);
            this.bindButtonEvents(this.creditsButton);
            this.bindButtonEvents(this.editorButton);
            
            this.playButton.parentTo(this.buttonContainer);
            this.editorButton.parentTo(this.buttonContainer);
            this.creditsButton.parentTo(this.buttonContainer);
            
            this.versionText.parentTo(this);
            this.headerText.parentTo(this);
            this.buttonContainer.parentTo(this);
            this.copyright.parentTo(this);

            this.lookingAt = null;
            this.lookAtTime = -Infinity;
            this.stageLookAtTime = Date.now();

            this.MAX_STAGE_VIEW_TIME = 12 * 1000;
            this.MAX_ENTITY_VIEW_TIME = 2 * 1000;
            
            this.titleWorld = new World(canvas);
            this.titleWorld.stageBackgroundColor = '#041d28';
            this.titleWorld.isDemoWorld = true;
            this.titleWorld.uiEnabled = false;
            this.titleWorld.loadStage(Levels.getRandomLevelNumber(true));
            this.titleWorld.start();

            this.onStart = new Event();
            this.onCredits = new Event();
            this.onEditor = new Event();
        }

        // resets the stage timers
        resetStageTimers () {
            this.stageLookAtTime = Date.now() - this.MAX_STAGE_VIEW_TIME;
            this.lookAtTime = -Infinity;
        }

        // updates the title screen
        update () {
            super.update();
            this.handleCamera();
            
            if (!Sounds.isThemePlayingType(Sounds.SND_TITLE_THEME)) {
                Sounds.playTheme(Sounds.SND_TITLE_THEME);
            }

            this.leftSelector.positionAbsolute.x = -30 + Math.sin(Date.now() / 100) * 5;
            this.rightSelector.positionAbsolute.x = 30 + -Math.sin(Date.now() / 100) * 5;
        }

        // renders the title screen
        render (...args) {
            this.titleWorld.render();
            super.render(...args);
        }

        // handles the worlds current camera state
        async handleCamera () {
            // just update at constant rate (60fps)
            this.titleWorld.update(1000 / 60);

            const entities = this.titleWorld.gameObjectManager.getGameObjectsByType(Entity);
            
            const elapsedLooking = Date.now() - this.lookAtTime;
            const elapsedOnStage = Date.now() - this.stageLookAtTime;

            if (elapsedOnStage > this.MAX_STAGE_VIEW_TIME) {
                await this.loadRandomStage();
            }

            const valid = entities.filter((entity) => entity.sprite.visible);

            if (valid.length > 0) {
                if (elapsedLooking > this.MAX_ENTITY_VIEW_TIME) {
                    this.lookingAt = valid[Math.floor(Math.random() * valid.length)];
                    this.lookAtTime = Date.now();

                    this.titleWorld.track(this.lookingAt);
                }
            } else if (this.titleWorld.camera.targetPoint === null || this.titleWorld.camera.targetPoint.equals(new Vector2(0, 0))) {
                this.titleWorld.camera.target(this.titleWorld.worldSize.scale(0.5));
            }
            
            this.titleWorld.setScale(0.5);
        }

        async loadRandomStage () {
            await this.titleWorld.loadStage(Levels.getRandomLevelNumber(true));
            this.lookAtTime = -Infinity;
            this.stageLookAtTime = Date.now();
        }

        // binds to any generic button events for
        // playing sounds and other effects
        bindButtonEvents (button) {
            button.mouseEnter.listen(() => {
                // display the left and right pointers
                this.leftSelector.parentTo(button);
                this.rightSelector.parentTo(button);
                this.leftSelector.visible = true;
                this.rightSelector.visible = true;
            });

            button.mouseLeave.listen(() => {
                // hide the pointers
                this.leftSelector.visible = false;
                this.rightSelector.visible = false;
            });

            button.mouseUp.listen(() => {
                if (this.isTransitioning) {
                    return;
                }

                if (button === this.playButton) {
                    this.onStart.trigger();
                } else if (button === this.creditsButton) {
                    this.onCredits.trigger();
                } else if (button === this.editorButton) {
                    this.onEditor.trigger();
                }
            });
        }
    }
})();