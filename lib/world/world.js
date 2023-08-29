import { UIFlamethrowerCutsceneScreen } from '/lib/ui/screens/uiFlamethrowerCutsceneScreen.js';
import { SnowmanBoss } from './gameobjects/entities/enemies/snomwanBoss.js';
import { UIGiftIndicators } from '/lib/ui/features/uiGiftIndicators.js';
import { GameObjectManager } from './gameobjects/gameObjectManager.js';
import { ParticlesManager } from '/lib/particles/particlesManager.js';
import { Physics } from '/lib/PhysicsJS2D/src/PhysicsJS2D.js';
import { Vector2 } from '/lib/PhysicsJS2D/src/vector2.js';
import { Event } from '/lib/PhysicsJS2D/src/event.js';
import { Constants } from '/lib/misc/constants.js';
import { UIManager } from '/lib/ui/uiManager.js';
import { Settings } from '/lib/misc/settings.js';
import { TileMap } from '/lib/tiles/tilemap.js';
import { Sounds } from '/lib/sounds/sounds.js';
import { Levels } from '/lib/misc/levels.js';
import { Debug } from '/lib/misc/debug.js';
import { Score } from '/lib/misc/score.js';
import { Tile } from '/lib/tiles/tile.js';
import { Camera } from './camera.js';

export const World = (function () {
    return class World {
        static BACKGROUND_COLOR_DUSK = '#073044';
        static BACKGROUND_COLOR_NIGHT = '#000000';
        static BACKGROUND_COLOR_DEEP_PURPLE = '#1a0e1a';

        // creates a new world simulation
        constructor (canvas, worldSize = new Vector2(0, 0), scale = Camera.DEFAULT_SCALE) {
            if (!canvas) {
                throw new Error('World requires a canvas element.');
            }

            this.canvas = canvas;
            this.context = canvas.getContext('2d');

            this.worldSize = worldSize;
            this.scale = scale;
            this.cursor = null;

            // create main world manager objects
            this.gameObjectManager = new GameObjectManager();
            this.particlesManager = new ParticlesManager();
            this.physics = new Physics(new Vector2(worldSize.x, worldSize.y));
            this.camera = new Camera(this, worldSize, scale);
            this.debug = new Debug(this, this.context);
            this.score = new Score();
            this.uiRoot = new UIManager(this.canvas);

            this.cutscene = null;
            
            // on screen ui elements
            this.giftIndicators = new UIGiftIndicators(this);
            this.uiRoot.addObject(this.giftIndicators);

            this.stageBackgroundColor = World.BACKGROUND_COLOR_DUSK;
            
            this.isDemoWorld = false;
            this.uiEnabled = true;

            this.stageClearing = false;
            this.isRunning = false;
            this.lastFrame = 0;
            this.elapsedTimeMs = 0;

            this.tileMap = null;
            this.player = null;
            
            this.fps = 0;
            this.frames = 0;

            this.maxFallY = worldSize.y + 1000;
            this.stage = 1;

            this.crossFade = 0;
            this.goalFade = this.crossFade;

            this.fadeColor = 'white';

            this.onUpdate = new Event();
            this.onComplete = new Event();

            this.renderPosition = new Vector2(0, 0);
            this.renderRegion = new Vector2(canvas.width, canvas.height);
        }

        // sets the position from which the world
        // will be rendered on the canvas
        setRenderPosition (position) {
            this.renderPosition = position;
        }

        // sets the region in which the world
        // will be rendered on the canvas
        setRenderRegion (region) {
            this.renderRegion = region;
        }

        // fetches and loads in the given tilemap
        // and materializes it into the world
        async loadTileMap (stageNumber) {
            const tileMap = new TileMap(stageNumber);
            const loadSuccess = await tileMap.load();

            if (!loadSuccess) {
                return;
            }

            const worldSize = tileMap.size.scale(Constants.TILE_SIZE);
            
            // things like physics and camera need to know
            // the world size, so we resize it here
            this.resize(worldSize);

            // materialize tiles and spawn gameObjects
            tileMap.materialize(this);
            tileMap.spawnGameObjects(this);
            
            // finally place the player at the spawn location
            if (this.player !== null) {
                const spawnLocation = tileMap.getSpawnLocation();
                
                if (spawnLocation === null) {
                    console.warn(`No spawn location found in tilemap: ${tileMapPath}`);
                } else {
                    this.player.setPosition(spawnLocation);
                }
            }
            
            this.tileMap = tileMap;
        }

        // sets the tilemap for the world
        setTileMap (tileMap) {
            this.tileMap = tileMap;
        }

        // loads in the given stage number
        async loadStage (stage, isReload = false) {
            if (stage < Levels.MIN_LEVEL || stage > Levels.MAX_LEVEL) {
                console.warn(`Invalid stage number: ${stage}`);
                return;
            }
            
            this.stage = stage;

            this.despawnAll();
            this.physics.clearObjects();
            this.particlesManager.clear();

            await this.loadTileMap(stage);
            await this.onAfterStageLoad(isReload);
        }

        // outsources some player collision logic with special objects
        // like doors, keys, etc. to here
        async handlePlayerCollision (other) {
            const tile = other.getTag('tile');

            if (!tile) {
                // only care about tile collisions
                // rest is internally handled by the player class
                return;
            }

            switch (tile.spriteIndex) {
                case Tile.SLEIGH:
                    if (this.tileMap.getGiftCount() > 0 || this.player.isDead()) {
                        return;
                    }
                    
                    this.score.increment('sleighReaches');

                    // player reached the sleigh
                    // load the next stage
                    await this.clearStage();
                    break;
            }
        }

        // called when player has died
        handlePlayerDeath () {
            Sounds.stopTheme(2);

            this.wait(1).then(() => {
                this.tweenCrossFade(1, 2, 'black');
            });
            
            this.wait(3).then(() => {
                this.onComplete.trigger(false);
            });
        }

        // clears the current stage and loads the given one
        async clearStage (nextStage) {
            if (this.stageClearing) {
                console.warn('Stage already clearing, rejecting clear request!');
                return;
            }

            this.stageClearing = true;

            if (this.player) {
                this.player.lockControls();
            }

            if (!nextStage) {
                nextStage = this.stage + 1;
            }

            const sleighTile = this.tileMap ? this.tileMap.getTileByIndex(Tile.SLEIGH) : null;

            if (sleighTile !== null) {
                // send the camera to the sleigh,
                // play the stinger and zoom in
                sleighTile.togglePrompt(false);
                this.track(sleighTile);
            } else if (this.player !== null) {
                this.track(this.player);
            } else {
                console.warn('No object to track for course clear!');
            }

            if (!this.isDemoWorld) {
                const stinger = Levels.getStinger(this.stage);

                if (stinger !== null) {
                    Sounds.playTheme(stinger, Sounds.MUSIC_DEFAULT_VOLUME, 1, false);
                }
            }

            const extraTime = Levels.isBossStage(this.stage) ? 1.25 : 1;
            
            this.wait(1).then(() => this.tweenCrossFade(1, 3 * extraTime));
            await this.tweenScale(Camera.DEFAULT_SCALE * 2, 4 * extraTime);
            
            if (nextStage > Levels.MAX_LEVEL) {
                // game complete
                this.onComplete.trigger(true, this.score);
            } else {
                // load next stage
                await this.loadStage(nextStage);
            }
            
            this.tweenCrossFade(0, 1);
            
            this.stageClearing = false;
        }

        // setups the world state after a stage was loaded
        async onAfterStageLoad (isReload) {
            if (Levels.isDayStage(this.stage)) {
                this.stageBackgroundColor = World.BACKGROUND_COLOR_DUSK;
            } else if (Levels.isNightStage(this.stage)) {
                this.stageBackgroundColor = World.BACKGROUND_COLOR_NIGHT;
            } else if (Levels.isWorkshopStage(this.stage)) {
                this.stageBackgroundColor = World.BACKGROUND_COLOR_DEEP_PURPLE;
            }

            this.camera.reset();

            if (this.cutscene !== null) {
                // cleanup any existing cutscene objects
                this.uiRoot.removeObject(this.cutscene);
                this.cutscene = null;
            }

            if (this.player !== null) {
                if (Levels.isNightStage(this.stage)) {
                    if (!Levels.isNightStage(this.stage - 1) && !isReload) {
                        // just enabled flamethrower so lets play a cutscene
                        const cutscene = new UIFlamethrowerCutsceneScreen(this.canvas);
                        this.uiRoot.addObject(cutscene);
                        
                        this.giftIndicators.visible = false;
                        
                        Sounds.stopTheme(1);
                        this.tweenCrossFade(0, 1);

                        this.cutscene = cutscene;

                        await this.wait(1);
                        await cutscene.playCutscene();
                        await this.wait(1);
                        
                        this.crossFade = 1;
                        this.tweenCrossFade(0, 1);

                        this.uiRoot.removeObject(cutscene);
                        this.cutscene = null;
                    }

                    this.player.flamethrower.enable();
                } else {
                    this.player.flamethrower.disable();
                }

                this.player.releaseControls();
                this.player.heal(this.player.maxHealth);

                this.spawn(this.player);
                this.track(this.player);
            }

            if (!this.isDemoWorld) {
                const theme = Levels.getTheme(this.stage);

                if (theme !== null) {
                    Sounds.playTheme(theme, Sounds.MUSIC_DEFAULT_VOLUME, 2);
                }
            }

            this.giftIndicators.visible = !Levels.isBossStage(this.stage);

            this.setScale(Camera.DEFAULT_SCALE);

            this.spawnSpecialEntities();
        }

        // spawns special entities like bosses from their tiles
        spawnSpecialEntities () {
            if (this.tileMap === null) {
                return;
            }

            for (let y = 0; y < this.tileMap.size.y; y++) {
                for (let x = 0; x < this.tileMap.size.x; x++) {
                    const tile = this.tileMap.tiles[y][x];

                    if (!tile) {
                        continue;
                    }

                    switch (tile.spriteIndex) {
                        case Tile.SNOWMAN:
                            if (Levels.isBossStage(this.stage)) {
                                this.spawn(new SnowmanBoss(tile.body.position));
                            }
                            return;
                    }
                }
            }
        }

        // draws the cursor at the given position
        renderCursor (position) {
            if (position.x < 0 && position.y < 0) {
                return;
            }

            if (this.cursor === null || this.cursor.complete === false || this.cursor.naturalWidth === 0) {
                return;
            }

            const cursorSize = new Vector2(144, 144);
            const renderSize = cursorSize.scale(0.25);
            
            this.context.drawImage(
                this.cursor,
                0, 0, cursorSize.x, cursorSize.y,
                position.x - renderSize.x / 2,
                position.y - renderSize.y / 2,
                renderSize.x, renderSize.y
            );
        }

        // resizes the world to the given size
        resize (size) {
            this.physics.setBounds(size);
            this.camera.worldSize = size;
            this.maxFallY = size.y + 1000;
            this.worldSize = size;
        }

        // initalizes and runs the main loop
        // for this world simulation
        start () {
            this.isRunning = true;
        }

        // stops running the world simulation
        stop () {
            this.isRunning = false;
        }

        // resets the entire world and clears all
        // ingame objects and tiles etc..
        reset () {
            this.stop();
            this.crossFade = 0;
            this.stageClearing = false;
            this.cutscene = null;
            this.elapsedTimeMs = 0;

            // allow threads waiting for onUpdate to be 
            // garbage collected
            this.onUpdate.clear(); 
            this.particlesManager.clear();

            // clone since we are modifying the array
            const gameObjects = this.gameObjectManager.getGameObjects().slice();

            for (const object of gameObjects) {
                this.despawn(object);
            }

            this.uiRoot.clearObjects();
            this.uiRoot.addObject(this.giftIndicators);
            
            if (this.tileMap) {
                this.tileMap.clear();
            }
            this.physics.clearObjects();
            this.camera.reset();
        }

        // updates the simulation including all
        // tiles, physics sim, and ingame objects
        update (deltaTime) {
            const now = Date.now();
            const delta = now - this.lastFrame;
            const current = Math.round(1000 / Math.max(delta, 1));
                
            this.lastFrame = now;
            this.frames = (this.frames + 1) % 200;
            
            if (this.frames === 0) {
                this.fps = 0;
            } else {
                this.fps += current;
            }

            this.physics.update(deltaTime);
            this.camera.update(deltaTime);
            this.particlesManager.update(deltaTime);

            if (this.uiEnabled) {
                this.uiRoot.update(deltaTime);
            }

            const despawnedObjects = this.gameObjectManager.update(deltaTime);

            for (const object of despawnedObjects) {
                // clean up bodies from despawned objects
                this.physics.removeBody(object.body);
            }

            this.elapsedTimeMs += deltaTime;
            this.score.set('timeBonus', Score.determineTimeBonus(this.elapsedTimeMs / 1000));

            this.onUpdate.trigger(deltaTime);
        }

        // draws the tilemap and all ingame objects
        // to the canvas
        render () {
            // before any rendering is done, we need to
            // set up the clipping

            this.context.save();
            
            const renderClippingRect = new Path2D();

            renderClippingRect.rect(
                this.renderPosition.x,
                this.renderPosition.y,
                this.renderRegion.x,
                this.renderRegion.y
            );

            this.context.clip(renderClippingRect);

            /*
                RenderOrder:
                    -> Background
                    -> TileMap
                    -> GameObjects
                    -> Particles
                    -> UI (On-screen UI => Fade => Debug => Cursor)
                
                Half pixel offset is applied
                for cleaner pixel rendering
            */            
            this.context.fillStyle = this.stageBackgroundColor;
            this.context.fillRect(0, 0, this.canvas.width + 1, this.canvas.height + 1);

            const renderOffset = this.camera.getOffset();

            if (this.tileMap) {
                this.tileMap.render(this.context, renderOffset, this.scale);
            }

            this.gameObjectManager.render(this.context, renderOffset, this.scale);
            this.particlesManager.render(this.context, renderOffset, this.scale);
            
            if (this.uiEnabled) {
                this.uiRoot.render();
            }

            if (this.crossFade > 0) {
                this.context.fillStyle = this.fadeColor;
                this.context.globalAlpha = this.crossFade;
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.globalAlpha = 1;
            }
            
            if (Settings.DebugModeEnabled) {
                this.debug.render();
            }

            if (this.player && this.cursor !== null) {
                this.renderCursor(this.player.screenMousePosition);
            }

            this.context.restore();
        }

        // emits the specified ammount of particles
        // with the given properties
        emitParticles (count, properties = {}) {
            this.particlesManager.emit(count, properties);
        }

        // creates a new particle emitter
        createEmitter (properties) {
            return this.particlesManager.createEmitter(properties);
        }

        // deletes a tile from the tilemap
        deleteTile (x, y) {
            if (this.tileMap === null) {
                return;
            }

            const tile = this.tileMap.getTile(x, y);

            if (tile === null) {
                return;
            }

            this.tileMap.removeTile(x, y);
            this.physics.removeBody(tile.body);
        }

        // despawns all ingame objects from the world
        despawnAll () {
            const objects = this.gameObjectManager.getGameObjects();

            while (objects.length > 0) {
                this.despawn(objects[0]);
            }
        }

        // sets the main player for the given world
        setPlayer (player) {
            if (this.player !== null) {
                // potential memory leak
                console.warn('World already has a player object!');
            }

            this.player = player;

            const collisionListener = this.handlePlayerCollision.bind(this);
            const deathListener = this.handlePlayerDeath.bind(this);

            this.player.body.collision.listen(collisionListener);
            this.player.onDeath.listen(deathListener);
        }

        // sets the cursor icon for the world
        setCursor (iconImage) {
            if (iconImage !== null && iconImage !== undefined) {
                this.cursor = iconImage
                this.canvas.style.cursor = 'none';
            } else {
                this.cursor = null;
                this.canvas.style.cursor = 'default';
            }
        }

        // returns a promise that resolves after
        // the specified time in seconds
        // helpful for async functions
        wait (timeSeconds) {
            return new Promise((resolve) => {
                let elapsedMs = 0;
                const onUpdate = (deltaMs) => {
                    elapsedMs += deltaMs;
                    if (elapsedMs >= timeSeconds * 1000) {
                        this.onUpdate.unlisten(onUpdate);
                        resolve();
                    }
                };
                this.onUpdate.listen(onUpdate);
            });
        }

        // tweens the scale of the world rendering
        // with the given duration
        tweenScale (scale, durationSeconds = 1) {
            const startScale = this.scale;
            let elapsedMs = 0;

            let promise = new Promise((resolve) => {
                let updateScale = (deltaTime) => {
                    elapsedMs += deltaTime;

                    const progress = elapsedMs / (durationSeconds * 1000);

                    if (progress >= 1) {
                        this.setScale(scale);
                        this.onUpdate.unlisten(updateScale);
                        resolve();
                        return;
                    }

                    const nextScale = startScale + (scale - startScale) * progress;

                    this.setScale(nextScale);
                }

                this.onUpdate.listen(updateScale)
            });

            return promise;
        }

        // tweens the crossfade of the world rendering
        // with the given duration
        tweenCrossFade (alpha, durationSeconds = 1, color = 'white') {
            this.goalFade = alpha;
            this.fadeColor = color;
            
            const startAlpha = this.crossFade;
            let elapsedMs = 0;

            let promise = new Promise((resolve) => {
                let updateFade = (deltaTime) => {
                    if (this.goalFade !== alpha) {
                        this.onUpdate.unlisten(updateFade);
                        resolve();
                        return;
                    }

                    elapsedMs += deltaTime;

                    const progress = elapsedMs / (durationSeconds * 1000);

                    if (progress >= 1) {
                        this.crossFade = alpha;
                        this.onUpdate.unlisten(updateFade);
                        resolve();
                        return;
                    }

                    const nextAlpha = startAlpha + (alpha - startAlpha) * progress;
                    this.crossFade = nextAlpha;
                }

                this.onUpdate.listen(updateFade);
            });

            return promise;
        }

        // sets the scale for the world rendering
        setScale (scale) {
            this.scale = scale;
            this.camera.setScale(scale);
        }

        // spawns an gameObject into the world
        spawn (gameObject) {
            if (gameObject.isSpawned) {
                console.warn('Trying to spawn an already spawned gameObject!');
                return;
            }
            
            this.physics.addBody(gameObject.body);
            this.gameObjectManager.spawn(gameObject);
            gameObject.onSpawn(this);
        }

        // despawns an gameObject from the world
        despawn (gameObject) {
            this.physics.removeBody(gameObject.body);
            this.gameObjectManager.despawn(gameObject);
            gameObject.onDespawn(this);
        }

        // locks the camera to the given gameObject
        track (gameObject) {
            this.camera.track(gameObject);
        }

        // unlocks the camera from tracking any gameObject
        untrack () {
            this.camera.track(null);
        }
    }
})();