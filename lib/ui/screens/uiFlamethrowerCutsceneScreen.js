import { Player } from '../../world/gameobjects/entities/player.js';
import { Vector2 } from '../../PhysicsJS2D/src/vector2.js';
import { UIBase } from '../uiBase.js';
import { UIText } from '../uiText.js';
import { World } from '../../world/world.js';
import { TileMap } from '../../tiles/tilemap.js';
import { Tile } from '../../tiles/tile.js';
import { Constants } from '../../misc/constants.js';
import { Sounds } from '../../sounds/sounds.js';

export const UIFlamethrowerCutsceneScreen = (function () {
    return class UIFlamethrowerCutsceneScreen extends UIBase {
        constructor (canvas) {
            super({
                sizeScale: new Vector2(1, 1)
            });

            this.canvas = canvas;
            this.player = new Player(this.canvas, false);
            
            this.world = new World(this.canvas, new Vector2(canvas.width, canvas.height));
            this.world.stageBackgroundColor = 'black';
            this.world.camera.smoothFollow = false;
            this.world.isDemoWorld = true;
            this.world.uiRoot.clearObjects();

            const tileMap = new TileMap(null);
            const additionalTiles = new Vector2(1, 0);
            tileMap.setSize(this.world.worldSize.div(Constants.TILE_SIZE).floor().add(additionalTiles));

            const tileStart = new Vector2(0, 5);

            for (let y = 0; y < tileMap.size.y - tileStart.y; y++) {
                for (let x = 0; x < tileMap.size.x; x++) {
                    const localPosition = new Vector2(tileStart.x + x, tileStart.y + y);
                    const worldPosition = localPosition.scale(Constants.TILE_SIZE);
                    const tile = new Tile(localPosition.y > tileStart.y ? 9 : 1, true, worldPosition);

                    tileMap.setTile(localPosition.x, localPosition.y, tile);
                }
            }

            tileMap.materialize(this.world);
            this.world.setTileMap(tileMap);

            const worldCenterX = this.world.worldSize.x / 2;
            const tileMapYStart = tileStart.y * Constants.TILE_SIZE;
            const playerSizeY = this.player.body.size.y;

            const playerPosition = new Vector2(worldCenterX, tileMapYStart - playerSizeY);

            this.player.setPosition(playerPosition);
            this.player.manuallyAnimated = true;
            this.player.playAnimation(this.player.animations.WALK);
            
            this.world.spawn(this.player);
            this.world.camera.target(this.world.worldSize.scale(0.5));
            
            this.player.flamethrower.enable();
            this.player.screenMousePosition = playerPosition.add(new Vector2(100));
            
            this.flamethrowerTitle = new UIText('FLAMETHROWER!!!', {
                fontSize: 30,
                fontColor: 'white',
                textAlign: 'center',
                size: new Vector2(100, 100),
                positionScale: new Vector2(0.5, 0.15),
                pivot: new Vector2(0.5, 0.5),
                visible: false,
            });
            this.flamethrowerTitle.parentTo(this);

            this.title1 = new UIText('FLAMETHROWER!!!', {
                fontColor: '#CB4A40',
                fontSize: 30,
                textAlign: 'center',
                pivot: new Vector2(0.15, 0.5),
                position: new Vector2(0, -10),
                positionScale: new Vector2(0.5, 0.5)
            });
            this.title1.parentTo(this.flamethrowerTitle);

            this.title2 = new UIText('FLAMETHROWER!!!', {
                fontColor: '#441C18',
                fontSize: 30,
                textAlign: 'center',
                pivot: new Vector2(0.15, 0.5),
                positionScale: new Vector2(0.5, 0.5),
                position: new Vector2(0, 10)
            });
            this.title2.parentTo(this.flamethrowerTitle);

            this.infoText = new UIText('CLICK AND HOLD TO MELT\nAWAY SNOW AND DEFEAT ENEMIES!', {
                fontColor: 'white',
                fontSize: 25,
                textAlign: 'center',
                shadow: true,
                shadowBlur: 0,
                shadowColor: '#80312D',
                shadowOffset: new Vector2(2, 2),
                positionScale: new Vector2(0.5, 0.15),
                pivot: new Vector2(0.5, 0.5)
            });
            this.infoText.parentTo(this);

            this.fade = new UIBase({
                sizeScale: new Vector2(1, 1),
                backgroundColor: 'white',
                backgroundEnabled: true,
                zIndex: 10
            });
            this.fade.parentTo(this);

            this.title1.visible = false;
            this.title2.visible = false;

            this.titleShaking = false;
            this.elapsedOnCutscene = 0;
        }

        playCutscene () {
            this.onUpdate.clear();
            this.flamethrowerTitle.visible = true;
            this.elapsedOnCutscene = 0;
            this.isShaking = false;
            this.title1.visible = false;
            this.title2.visible = false;
            this.flamethrowerTitle.fontSize = 100;

            let currentFontSize = 100;
            let fallVelocity = 0;

            const onUpdate = () => {
                fallVelocity += 1;
                currentFontSize -= fallVelocity;

                if (currentFontSize <= 40) {
                    this.titleShaking = true;

                    Sounds.playSfx(Sounds.SND_EXPLOSION, Sounds.SFX_VOLUME);
                    this.world.camera.shake(2, 1);
                    this.onUpdate.unlisten(onUpdate);

                    new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
                        this.titleShaking = false;
                    });
                }

                this.flamethrowerTitle.fontSize = currentFontSize;
            }

            this.onUpdate.listen(onUpdate);

            return new Promise((resolve) => {
                this.onUpdate.listen(() => {
                    if (this.elapsedOnCutscene >= 8) {
                        resolve();
                    }
                })
            });
        }

        getTitleOffset (intensity) {
            const center = new Vector2(0.5, 0.5);
            const noise = new Vector2(Math.random(), Math.random()).scale(intensity);

            const xSign = Math.random() > 0.5 ? 1 : -1;
            const ySign = Math.random() > 0.5 ? 1 : -1;

            return center.add(noise.multiply(new Vector2(xSign, ySign)));
        }

        clamp (number, min, max) {
            return Math.min(Math.max(number, min), max);
        }

        render (context, screenSize) {
            this.renderObject(context, screenSize);

            this.world.render();
            
            this.renderChildren(context, screenSize);
        }

        update (deltaTime) {
            super.update(deltaTime);
            this.world.update(deltaTime);

            this.elapsedOnCutscene += deltaTime / 1000;
            this.world.tileMap.renderOffset.x = -(this.world.elapsedTimeMs / 7 % Constants.TILE_SIZE);

            if (this.titleShaking) {
                this.title1.visible = true;
                this.title2.visible = true;

                this.title1.positionScale = this.getTitleOffset(0.25);
                this.title2.positionScale = this.getTitleOffset(0.25);
            } else {
                this.title1.visible = false;
                this.title2.visible = false;
            }

            this.flamethrowerTitle.textTransparency = this.clamp(2 - this.elapsedOnCutscene, 0, 1);
            this.infoText.textTransparency = this.clamp(this.elapsedOnCutscene - 3, 0, 1);
            this.fade.transparency = this.clamp(this.elapsedOnCutscene - 7, 0, 1);

            if (this.elapsedOnCutscene >= 3 && this.elapsedOnCutscene <= 6) {
                if (!this.player.flamethrower.firing()) {
                    this.player.flamethrower.start();
                }
            } else {
                this.player.flamethrower.stop();
            }
        }
    }
})();