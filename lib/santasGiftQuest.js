import { UILevelSelectScreen } from './ui/screens/uiLevelSelectScreen.js';
import { UITutorialScreen } from './ui/screens/uiTutorialScreen.js';
import { UISettingsPanel } from './ui/features/uiSettingsPanel.js';
import { UICreditsScreen } from './ui/screens/uiCreditsScreen.js';
import { Player } from './world/gameobjects/entities/player.js';
import { UIScoreScreen } from './ui/screens/uiScoreScreen.js';
import { UIDeathScreen } from './ui/screens/uiDeathScreen.js';
import { UITitleScreen } from './ui/screens/uiTitleScreen.js';
import { UIPauseScreen } from './ui/screens/uiPauseScreen.js';
import { UIStatusBar } from './ui/features/uiStatusBar.js';
import { Vector2 } from './PhysicsJS2D/src/vector2.js';
import { UIManager } from './ui/uiManager.js';
import { Settings } from './misc/settings.js';
import { Sprite } from './sprites/sprite.js';
import { Sounds } from './sounds/sounds.js';
import { Levels } from './misc/levels.js';
import { World } from './world/world.js';
import { UIFade } from './ui/uiFade.js';
import { Tween } from './misc/tween.js';
import { Debug } from './misc/debug.js';

export const SantasGiftQuest = (function () {
    return class SantasGiftQuest {
        
        static CANVAS_SCALE = 1.2;
        static DEFAULT_CANVAS_SIZE = new Vector2(900 * SantasGiftQuest.CANVAS_SCALE, 600 * SantasGiftQuest.CANVAS_SCALE);
        static FRAME_RATE_CAP = 1000 / 80;
        // static DEFAULT_CANVAS_SIZE = new Vector2(1920, 1080);

        static DEBUG_TOGGLE_KEY = 'q';
        static STAGE_RESET_KEY = 'r';
        static DEBUG_STAGE_CLEAR_KEY = 'c';
        static DEBUG_ACTION_KEY = 'f';
        static GAME_PAUSE_KEY = 'p';
        static DEBUG_SECRET = 'jinglebells';

        // creates a new game on the given
        // canvas element
        constructor (canvasDom) {
            this.canvas = canvasDom;
            this.context = canvasDom.getContext('2d');
            this.initialized = false;
            this.isRunning = false;

            this.mainWorld = null;
            this.player = new Player(canvasDom, true);
            this.uiRoot = new UIManager(canvasDom, true);

            this.transition = new UIFade('#ffffff');
            this.creditsScreen = new UICreditsScreen();
            this.scoreScreen = new UIScoreScreen();
            this.deathScreen = new UIDeathScreen();
            this.tutorialScreen = new UITutorialScreen(this.canvas);

            this.levelSelectScreen = new UILevelSelectScreen();
            this.levelSelectScreen.stageSelected.listen(async (stageNumber) => {
                if (this.transition.isTransitioning) {
                    return;
                }

                await this.transition.fadeTo(1, 1000);

                this.levelSelectScreen.visible = false;

                if (stageNumber === 1) {
                    this.tutorialScreen.visible = true;
                    this.transition.fadeTo(0, 1000);
                    await this.tutorialScreen.setupTitleSimulation();
                    await this.transition.fadeTo(1, 1000);
                    this.tutorialScreen.visible = false;
                }

                this.startMainWorld(stageNumber);

                this.transition.fadeTo(0, 1000);
            })
            
            this.uiRoot.addObject(this.creditsScreen);
            this.uiRoot.addObject(this.transition);
            this.uiRoot.addObject(this.scoreScreen);
            this.uiRoot.addObject(this.deathScreen);
            this.uiRoot.addObject(this.tutorialScreen);
            this.uiRoot.addObject(this.levelSelectScreen);
            
            this.titleScreen = null;
            this.pauseScreen = null;
            this.statusBar = null;
            this.settingsPanel = null;

            this.gameIsPaused = false;
            this.settings = Settings;

            this.lastFrame = Date.now();
            this.dts = '';
        }

        // creates the title screen ui element
        createTitleScreen () {
            if (this.titleScreen) {
                return null;
            }

            const titleScreen = new UITitleScreen(this.canvas);
            this.uiRoot.addObject(titleScreen);

            titleScreen.onStart.listen(async () => {
                if (this.transition.isTransitioning) {
                    return;
                }

                await this.transition.fadeTo(1, 1000);

                this.levelSelectScreen.visible = true;

                titleScreen.visible = false;
                this.statusBar.menuToggle.visible = true;
                
                // this.startMainWorld();
                // Sounds.stopTheme(1);

                this.transition.fadeTo(0, 1000);
            });
            
            titleScreen.onCredits.listen(async () => {
                if (this.transition.isTransitioning) {
                    return;
                }

                await this.transition.fadeTo(1, 1000);

                this.creditsScreen.creditsText.positionAbsolute.y = 0;
                this.creditsScreen.visible = true;
                this.titleScreen.visible = false;

                this.statusBar.pauseToggle.visible = false;
                this.statusBar.menuToggle.visible = true;

                this.transition.fadeTo(0, 1000);
            });

            return titleScreen;
        }

        // creates the pause screen ui element
        createPauseScreen () {
            if (this.pauseScreen) {
                return null;
            }

            const pauseScreen = new UIPauseScreen(this.canvas);

            pauseScreen.onResume.listen(() => {
                if (this.transition.isTransitioning) {
                    return;
                }

                this.statusBar.menuToggle.visible = true;
                this.statusBar.pauseToggle.visible = true;    

                this.resumeMainWorld();
            });
            
            pauseScreen.onQuit.listen(async () => {
                if (this.transition.isTransitioning) {
                    return;
                }

                await this.transition.fadeTo(1, 1000);
                
                this.mainWorld.stop();
                this.mainWorld.reset();

                if (this.settingsPanel.visible) {
                    this.statusBar.settingsToggle.mouseUp.trigger();
                }
                
                this.statusBar.pauseToggle.visible = false;
                this.statusBar.menuToggle.visible = false;
                this.titleScreen.visible = true;

                this.resumeMainWorld();

                this.transition.fadeTo(0, 1000);
            });

            this.uiRoot.addObject(pauseScreen);

            return pauseScreen;
        }

        // creates the ui status bar
        createStatusBar () {
            if (this.statusBar) {
                return null;
            }

            const statusBar = new UIStatusBar();
            this.uiRoot.addObject(statusBar);

            statusBar.onPause.listen(() => {
                if (this.transition.isTransitioning) {
                    return;
                }

                this.pauseMainWorld();
            });

            statusBar.onMenu.listen(() => this.returnToMenu());

            statusBar.onSettings.listen(() => {
                this.settingsPanel.visible = !this.settingsPanel.visible;

                if (this.titleScreen.visible) {
                    const menuState = !this.settingsPanel.visible;

                    this.titleScreen.buttonContainer.visible = menuState;
                    this.titleScreen.headerText.visible = menuState;
                }
            });

            return statusBar;
        }

        // creates the settings panel
        createSettingsPanel () {
            if (this.settingsPanel) {
                return null;
            }

            const settingsPanel = new UISettingsPanel();
            this.uiRoot.addObject(settingsPanel);

            return settingsPanel;
        }

        // initializes the game
        // preloading all the assets
        async init () {
            console.log('Initializing game...');
            await this.preload();
            console.log('Preload complete.');

            // set canvas size
            this.canvas.width = SantasGiftQuest.DEFAULT_CANVAS_SIZE.x;
            this.canvas.height = SantasGiftQuest.DEFAULT_CANVAS_SIZE.y;

            // instantiate ui instances now that assets have been loaded
            this.titleScreen = this.createTitleScreen();
            this.statusBar = this.createStatusBar();
            this.pauseScreen = this.createPauseScreen();
            this.settingsPanel = this.createSettingsPanel();

            this.scoreScreen.onMenu.listen(() => this.returnToMenu());
            this.deathScreen.onMenu.listen(() => this.returnToMenu());

            // set up event listeners
            document.addEventListener('keydown', (e) => {
                const key = e.key.toLowerCase();

                this.dts += key;

                if (!this.dts.startsWith(SantasGiftQuest.DEBUG_SECRET.slice(0, this.dts.length))) {
                    this.dts = '';
                } else {
                    if (this.dts === SantasGiftQuest.DEBUG_SECRET) {
                        this.dts = '';
                        this.toggleDebug(!Settings.DebugModeEnabled);
                    }
                    return;
                }

                switch (key) {
                    // case SantasGiftQuest.DEBUG_TOGGLE_KEY:
                    //     Settings.DebugModeEnabled = !Settings.DebugModeEnabled;
                    //     break;
                    case SantasGiftQuest.STAGE_RESET_KEY:
                        if (!this.mainWorld.isRunning) {
                            return;
                        }

                        const player = this.player;
                        const world = this.mainWorld;

                        if (world.stageClearing) {
                            return;
                        }
                
                        if (player.isDead()) {
                            player.heal(Infinity);
                            player.sprite.transparency = 1;
                        }
                
                        world.loadStage(world.stage);

                        break;
                    case SantasGiftQuest.DEBUG_STAGE_CLEAR_KEY:
                        if (!this.mainWorld.isRunning) {
                            return;
                        }
                        
                        this.mainWorld.clearStage();
                        break;
                    case SantasGiftQuest.DEBUG_ACTION_KEY:
                        Debug.test(this);
                        break;
                    case SantasGiftQuest.GAME_PAUSE_KEY:
                        if (!this.mainWorld.isRunning) {
                            return;
                        }

                        if (this.gameIsPaused) {
                            this.resumeMainWorld();
                        } else {
                            this.pauseMainWorld();
                        }
                        break;
                }
            });

            // finally create the main world
            this.mainWorld = new World(this.canvas);
            this.mainWorld.setPlayer(this.player);

            this.mainWorld.onComplete.listen(async (completedTheGame, scoreObject) => {
                // disable and hide world
                this.mainWorld.stop();
                this.mainWorld.reset();
                this.transition.backgroundColor = completedTheGame ? 'white' : 'black';
                this.transition.setFade(1);
                
                // hide ui
                this.statusBar.menuToggle.visible = false;
                this.statusBar.pauseToggle.visible = false;
                
                // display corresponding result
                if (completedTheGame) {
                    this.scoreScreen.reset();
                    this.scoreScreen.visible = true;
                    new Promise((resolve) => setTimeout(resolve, 200)).then(() => {
                        this.scoreScreen.playScoreAnimations(scoreObject);
                    });
                } else {
                    this.deathScreen.reset();
                    this.deathScreen.visible = true;
                }
                
                // transition in
                this.transition.fadeTo(0, 3000).then(() =>{
                    this.transition.backgroundColor = 'white';
                });
            });

            this.initialized = true;
        }

        // starts the game from stage one
        async startMainWorld (stageNumber = Levels.MIN_LEVEL) {
            if (!this.initialized) {
                return;
            }
            
            if (!this.mainWorld.isRunning) {
                this.mainWorld.start();
            }

            await this.mainWorld.loadStage(stageNumber);

            this.statusBar.menuToggle.visible = true;
            this.statusBar.pauseToggle.visible = true;
        }

        // main update loop for all
        // game processes
        update (deltaTime) {
            if (!this.initialized) {
                return;
            }

            Tween.update(deltaTime);
            this.uiRoot.update(deltaTime);
            
            if (this.mainWorld.isRunning && !this.gameIsPaused) {
                this.mainWorld.update(deltaTime);
            }
        }

        // main render loop for all
        // game processes
        render () {
            if (!this.initialized) {
                return;
            }

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.translate(-0.5, -0.5);

            if (this.mainWorld.isRunning) {
                this.mainWorld.render();
            }

            this.uiRoot.render();

            this.context.translate(0.5, 0.5);
        } 

        loop () {
            if (!this.initialized || !this.isRunning) {
                return;
            }

            const now = Date.now();
            const deltaTime = now - this.lastFrame;

            if (deltaTime > SantasGiftQuest.FRAME_RATE_CAP) {
                this.update(deltaTime);
                this.render();

                this.lastFrame = now;
            }

            requestAnimationFrame(this.loop.bind(this));
        }

        // runs the game
        globalStart () {
            if (this.isRunning) {
                return;
            }
            
            this.isRunning = true;
            this.loop();

            Sounds.resumeAudioContext();
        }

        // stops the game
        globalStop () {
            this.isRunning = false;
            Sounds.suspendAudioContext();
        }

        toggleDebug (state) {
            Settings.DebugModeEnabled = state;
        }

        // brings the game back to the title screen
        async returnToMenu () {
            if (this.transition.isTransitioning) {
                return;
            }

            await this.transition.fadeTo(1, 1000);

            if (this.mainWorld.isRunning) {
                // exiting game
                this.mainWorld.stop();
                this.mainWorld.reset();
            }

            if (this.gameIsPaused) {
                this.resumeMainWorld(); // in-case the game was paused
            }
            
            // hide any other open screens
            this.scoreScreen.visible = false;
            this.deathScreen.visible = false;
            this.creditsScreen.visible = false;
            this.tutorialScreen.visible = false;
            this.levelSelectScreen.visible = false;
            this.settingsPanel.visible = false;
            this.pauseScreen.visible = false;

            if (this.settingsPanel.visible) {
                this.statusBar.settingsToggle.mouseUp.trigger();
            }

            // disable ingame status bar ui
            this.statusBar.pauseToggle.visible = false;
            this.statusBar.menuToggle.visible = false;

            // toggle title screen
            this.titleScreen.resetStageTimers();
            this.titleScreen.visible = true;

            this.transition.fadeTo(0, 1000);
        }

        // pauses the current game the player
        // is playing
        pauseMainWorld () {
            Sounds.muteMusic(true);

            this.statusBar.menuToggle.visible = false;
            this.statusBar.pauseToggle.visible = false;

            this.gameIsPaused = true;
            this.pauseScreen.visible = true;
        }

        // resumes the current game the player
        // is playing
        resumeMainWorld () {
            Sounds.unmuteMusic(true);

            this.pauseScreen.visible = false;
            this.gameIsPaused = false;
        }

        // preloads all content needed
        // for the game
        async preload () {
            await Promise.all([
                Sprite.preloadAll(),
                Sounds.preloadAll(),
                Levels.preloadAll()
            ]);
        }
    }
})();