import { Penguin } from "../../world/gameobjects/entities/enemies/penguin.js";
import { Gift } from "../../world/gameobjects/collectables/gift.js";
import { Player } from "../../world/gameobjects/entities/player.js";
import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Event } from "../../PhysicsJS2D/src/event.js";
import { Constants } from "../../misc/constants.js";
import { TileMap } from "../../tiles/tilemap.js";
import { Sounds } from "../../sounds/sounds.js";
import { World } from "../../world/world.js";
import { Tween } from "../../misc/tween.js";
import { Tile } from "../../tiles/tile.js";
import { UIBase } from "../uiBase.js";
import { UIText } from "../uiText.js";

export const UITutorialScreen = (function () {
    return class UITutorialScreen extends UIBase {
        constructor (canvas) {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#021C29",
                transparency: 1,
                backgroundEnabled: true,
                visible: false
            });

            this.simulationContainer = new UIBase({
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.5),
                size: new Vector2(550, 250),
                backgroundEnabled: false
            });
            this.simulationContainer.parentTo(this);

            this.tipsText = new UIText('', {
                pivot: new Vector2(0.5, 0),
                positionScale: new Vector2(0.5, 0),
                position: new Vector2(0, 25),
                fontColor: 'white',
                font: 'Gotham'
            });
            this.tipsText.parentTo(this.simulationContainer);

            this.fadeOverlay = new UIBase({
                sizeScale: new Vector2(1, 1),
                backgroundEnabled: true,
                backgroundColor: 'white',
                transparency: 0
            });
            this.fadeOverlay.parentTo(this.simulationContainer);

            this.canvas = canvas;
            this.fadeTween = null;

            // create the sim player object
            this.player = new Player(this.canvas, false);
            this.player.body.boundsConstrained = false;
            this.player.maxSpeed = 5;
            this.player.jumpPower = 18;

            // setup the tutorial world
            this.world = new World(this.canvas, new Vector2(550 * 2, 250), 1);

            this.world.stageBackgroundColor = 'black';
            this.world.spawn(this.player);

            // set the camera position
            this.world.camera.smoothFollow = false;
            this.world.camera.target(this.world.worldSize.scale(0.5).add(new Vector2(0, -12)));

            // load in the floor tiles
            const tileMap = new TileMap(null);
            tileMap.setSize(this.world.worldSize.div(Constants.TILE_SIZE).floor());

            for (let x = 0; x < tileMap.size.x; x++) {
                const worldPosition = new Vector2(x, tileMap.size.y - 1).scale(Constants.TILE_SIZE);
                const tile = new Tile(1, true, worldPosition);

                tileMap.setTile(x, tileMap.size.y - 1, tile);
            }

            this.spikeTilePosition = new Vector2(Math.floor(tileMap.size.x / 2), tileMap.size.y - 2);
            this.spike = new Tile(Tile.SPIKE, false, this.spikeTilePosition.scale(Constants.TILE_SIZE));
            this.spike.sprite.visible = false;
            tileMap.setTile(this.spikeTilePosition.x, this.spikeTilePosition.y, this.spike);

            this.sleighTilePosition = new Vector2(this.spikeTilePosition.x + 3, this.spikeTilePosition.y);
            this.sleigh = new Tile(Tile.SLEIGH, false, this.sleighTilePosition.scale(Constants.TILE_SIZE));
            this.sleigh.sprite.visible = false;
            this.sleigh.promptText = null;
            tileMap.setTile(this.sleighTilePosition.x, this.sleighTilePosition.y, this.sleigh);

            tileMap.materialize(this.world);
            this.world.setTileMap(tileMap);

            this.gift = new Gift(Tile.GREEN_GIFT, this.world.camera.targetPoint.subtract(new Vector2(30, 5)));
            this.world.spawn(this.gift);

            this.penguin = new Penguin(this.spikeTilePosition.scale(Constants.TILE_SIZE), true);
            this.penguin.maxSpeed = 0;
            this.penguin.sprite.flipHorizontal(true);
            this.world.spawn(this.penguin);
            this.penguin.sprite.visible = false;

            this.tutorialCompleted = new Event();

            this.world.start();
        }

        async setupTitleSimulation () {
            this.world.particlesManager.clear();
            this.world.onUpdate.clear();
            this.player.onUpdate.clear();
            
            const gameObjects = [this.gift, this.player, this.penguin];

            for (const gameObject of gameObjects) {
                if (!gameObject.isSpawned) {
                    this.world.spawn(gameObject);
                }

                gameObject.sprite.visible = true;
                gameObject.sprite.transparency = 1;
            }

            this.penguin.heal(Infinity);
            this.player.maxSpeed = 5;
            this.player.invulnerable = false;
            this.gift.isCollected = false;
            this.gift.collectTime = null;
            this.penguin.sprite.visible = false
            this.sleigh.sprite.visible = false;
            this.spike.sprite.visible = false;
            this.gift.setPosition(this.world.camera.targetPoint.subtract(new Vector2(30, 5)));
            this.gift.sprite.setIndex(Tile.GREEN_GIFT);
            this.player.body.collision.handlers.splice(1, Infinity);

            this.setTipsText('Santa has lost all of his gifts!\nCollect them all to save christmas!');
            this.resetPlayer();

            await this.walkToX(852);
            await this.pause(1);
            await this.fadeTo(1, 500);

            this.setTipsText('Uh oh! Spikes!');
            this.resetPlayer();

            this.spike.sprite.visible = true;

            this.fadeTo(0, 500);
            this.listenForTileCollision(Tile.SPIKE).then(() => {
                this.setTipsText('Watch out for icy hazards along the way...');
            });
            await this.walkToX(852);
            await this.pause(1);
            await this.fadeTo(1, 500);

            this.setTipsText('Beware of agressive pengiuns!');
            this.resetPlayer();

            this.spike.sprite.visible = false;
            this.penguin.sprite.visible = true;

            this.fadeTo(0, 500);
            this.listenForEntityCollision(Penguin).then(() => {
                this.setTipsText('They\'re not as friendly as they seem...');
            });
            
            await this.walkToX(852);
            await this.pause(1);
            await this.fadeTo(1, 500);

            this.setTipsText('Reach the sleigh at the end of each stage to progress.');
            this.resetPlayer();

            this.penguin.sprite.visible = false;
            this.gift.setPosition(this.world.camera.targetPoint.subtract(new Vector2(Constants.TILE_SIZE * 1.5, 5)));
            if (!this.gift.isSpawned) {
                this.world.spawn(this.gift);
            }
            this.gift.isCollected = false;
            this.gift.sprite.visible = true;
            this.gift.sprite.transparency = 1;
            this.spike.sprite.visible = true;
            this.sleigh.sprite.visible = true;
            this.player.maxSpeed = 8;

            this.fadeTo(0, 500);

            this.listenForCollectableCollection().then(() => {
                this.player.motionJump();
            });

            this.walkToX(852);
            await this.listenForTileCollision(Tile.SLEIGH);
            this.player.haltMovement();

            await this.pause(2);

            this.setTipsText('Are you ready to save christmas?');
            this.player.sprite.flipHorizontal(true);

            await this.pause(3);

            this.tutorialCompleted.trigger();
        }

        render (context, screenSize) {
            this.renderObject(context, screenSize);

            const renderExtents = this.getSimulationRenderExtents(screenSize);
            
            this.world.setRenderPosition(renderExtents.position);
            this.world.setRenderRegion(renderExtents.size);
            this.world.render();
            
            this.renderChildren(context, screenSize);
        }

        update (deltaTime) {
            super.update(deltaTime);

            if (!Sounds.isThemePlayingType(Sounds.SND_TUTORIAL_THEME)) {
                Sounds.playTheme(Sounds.SND_TUTORIAL_THEME, Sounds.MUSIC_DEFAULT_VOLUME, 1);
            }

            this.world.update(deltaTime);
        }

        getSimulationRenderExtents (screenSize) {
            const containerPosition = this.simulationContainer.getScreenPosition(screenSize),
                containerSize = this.simulationContainer.getScreenSize(screenSize);
            
            return {
                position: containerPosition,
                size: containerSize,
            }
        }

        walkToX (xPosition) {
            const currentX = this.player.body.position.x;

            if (currentX < xPosition) {
                this.player.motionWalk(0.25);
            } else if (currentX > xPosition) {
                this.player.motionWalk(-0.25);
            }
        
            return new Promise((resolve) => {
                const checkPosition = () => {
                    const withinDistance = Math.abs(this.player.body.position.x - xPosition) < 5;
    
                    if (withinDistance) {
                        this.player.haltMovement();
                        this.player.onUpdate.unlisten(checkPosition);
                        resolve();
                    }
                };
                
                this.player.onUpdate.listen(checkPosition);
            })
        }

        fadeTo (transparency, duration) {
            if (this.fadeTween !== null) {
                this.fadeTween.cancel();
            }

            this.fadeTween = new Tween(duration, [[this.fadeOverlay.transparency, transparency]])

            return this.fadeTween.begin((transparency) => {
                this.fadeOverlay.transparency = transparency;
            });
        }

        pause (duration) {
            return this.world.wait(duration);
        }

        setTipsText (text) {
            this.tipsText.text = text;
        }

        resetPlayer () {
            this.player.haltMovement();
            this.player.setPosition(Vector2.zero);
            this.player.heal(Infinity);
        }

        listenForTileCollision (tileIndex) {
            return new Promise((resolve) => {
                const checkCollision = (collision) => {
                    const tile = collision.getTag('tile');

                    if (tile && tile.spriteIndex === tileIndex) {
                        this.player.body.collision.unlisten(checkCollision);
                        resolve();
                    }
                };

                this.player.body.collision.listen(checkCollision);
            })
        }

        listenForEntityCollision (entityType) {
            return new Promise((resolve) => {
                const checkCollision = (collision) => {
                    const entity = collision.getTag('entity');

                    if (entity instanceof entityType) {
                        this.player.body.collision.unlisten(checkCollision);
                        resolve();
                    }
                };

                this.player.body.collision.listen(checkCollision);
            })
        }

        listenForCollectableCollection () {
            return new Promise((resolve) => {
                const checkCollection = (collectable) => {
                    if (!collectable.getTag('collectable')) {
                        return;
                    }

                    this.player.body.collision.unlisten(checkCollection);
                    resolve();
                };

                this.player.body.collision.listen(checkCollection);
            })
        }
    }
})();