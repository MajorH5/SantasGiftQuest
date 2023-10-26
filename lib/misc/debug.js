import { Reindeer } from '../world/gameobjects/entities/friendlies/reindeer.js';
import { Elf } from '../world/gameobjects/entities/friendlies/elf.js';
import { Entity } from '../world/gameobjects/entities/entity.js';
import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Constants } from '../misc/constants.js';
import { Ray } from '../PhysicsJS2D/src/ray.js';
import { Sounds } from '../sounds/sounds.js';
import { Score } from '../misc/score.js';
import { Tile } from '../tiles/tile.js';

// static class for rendering debug informtation
// out the the canvas
export const Debug = (function () {
    return class Debug {
        static STATE_INFO_X_START = 10;
        static STATE_INFO_Y_START = 80;

        static STATE_INFO_MAX_Y = Debug.STATE_INFO_Y_START + 140;

        static STATE_INFO_Y_INCREMENT = 15;
        static STATE_INFO_X_INCREMENT = 230;

        static OBJECT_INFO_MAX_Y = Debug.STATE_INFO_MAX_Y + 195;
        static OBJECT_INFO_X_START = 10;
        static OBJECT_INFO_Y_START = Debug.STATE_INFO_MAX_Y + 20;
        static OBJECT_INFO_Y_INCREMENT = 15;
        static OBJECT_INFO_X_INCREMENT = 200;

        constructor (world, context) {
            this.world = world;
            this.context = context;

            this.currentStateInfoY = Debug.STATE_INFO_Y_START;
            this.currentStateInfoX = Debug.STATE_INFO_X_START;

            this.currentObjectInfoY = Debug.OBJECT_INFO_Y_START;
            this.currentObjectInfoX = Debug.OBJECT_INFO_X_START;
        }

        // converts a given value to a formatted string
        static formatValue (value) {
            if (value instanceof Vector2) {
                return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)})`;
            } else if (typeof value === 'number' && value % 1 !== 0) {
                return value.toFixed(2).toString();
            } else if (typeof value === 'undefined' || value === null) {
                return '(no value)';
            } else if (typeof value !== 'string') {
                return value.toString();
            }

            return value;
        }

        // writes a debug value to the canvas
        drawWorldStateInfo (name, value = '', xIndent = 0) {
            this.context.fillStyle = "white";
            this.context.textAlign = "left";
            this.context.font = "11px Monospace";

            value = Debug.formatValue(value);

            this.writeWorldState(`${'\t'.repeat(xIndent)}${name}: ${value}`);
        }

        // writes world state information to the canvas
        writeWorldState (text) {
            this.context.fillStyle = "white";
            this.context.textAlign = "left";
            this.context.font = "11px Monospace";

            this.context.fillText(text, this.currentStateInfoX, this.currentStateInfoY);
            this.currentStateInfoY += Debug.STATE_INFO_Y_INCREMENT;

            if (this.currentStateInfoY > Debug.STATE_INFO_MAX_Y) {
                this.currentStateInfoY = Debug.STATE_INFO_Y_START;
                this.currentStateInfoX += Debug.STATE_INFO_X_INCREMENT;
            }
        }
        
        // writes properties of a gameObject
        // to the context
        drawGameObjectInfo (gameObject) {
            this.context.fillStyle = "white";
            this.context.textAlign = "left";
            this.context.font = "11px Monospace";

            const properties = [
                ['Position', gameObject.body.getPosition()],
                ['Velocity', gameObject.body.getVelocity()],
                ['Rotation', gameObject.body.rotation],
            ];

            if (gameObject instanceof Entity) {
                properties.push(['Health', gameObject.health]);
                properties.push(['Animation', gameObject.getCurrentAnimationName()]);

                if (gameObject.isDead()) {
                    properties.push(['TimeTilDespawn', gameObject.despawnDelay - gameObject.getDespawnTimer() * gameObject.despawnDelay]);
                }
            }

            const objectName = gameObject.constructor.name;

            this.writeObjectInfo(`${objectName}:`);

            for (let [name, value] of properties) {
                value = Debug.formatValue(value);
                this.writeObjectInfo(`\t${name}: ${value}`);
            }
        }

        // writes object property to the screen
        writeObjectInfo (text) {
            this.context.fillStyle = "white";
            this.context.textAlign = "left";
            this.context.font = "11px Monospace";

            this.context.fillText(text, this.currentObjectInfoX, this.currentObjectInfoY);

            this.currentObjectInfoY += Debug.OBJECT_INFO_Y_INCREMENT;

            if (this.currentObjectInfoY > Debug.OBJECT_INFO_MAX_Y) {
                this.currentObjectInfoY = Debug.OBJECT_INFO_Y_START;
                this.currentObjectInfoX += Debug.OBJECT_INFO_X_INCREMENT;
            }
        }

        // draws the debug information to the canvas
        render () {
            this.currentStateInfoY = Debug.STATE_INFO_Y_START;
            this.currentStateInfoX = Debug.STATE_INFO_X_START;

            this.currentObjectInfoY = Debug.OBJECT_INFO_Y_START;
            this.currentObjectInfoX = Debug.OBJECT_INFO_X_START;

            const world = this.world;

            const particlesManager = world.particlesManager;
            const canvas = world.canvas;
            const camera = world.camera;
            const tileMap = world.tileMap;
            const physics = world.physics;
            const player = world.player;

            const gameObjects = world.gameObjectManager.getGameObjects();
            const cameraOffset = camera.getOffset(), cameraScale = camera.getScale();
            const screenSize = new Vector2(canvas.width, canvas.height);

            // show physics chunks
            const chunks = physics.bodyChunks;

            for (let y = 0; y < chunks.chunksY; y++){
                for (let x = 0; x < chunks.chunksX; x++){
                    const chunk = chunks.chunks[y][x];

                    if (chunk.length === 0) {
                        continue;
                    }

                    this.context.fillStyle = 'blue';
                    this.context.globalAlpha = 0.3;
                    this.context.fillRect(
                        (x * chunks.chunkSize) * cameraScale + cameraOffset.x * cameraScale,
                        (y * chunks.chunkSize) * cameraScale + cameraOffset.y * cameraScale,
                        chunks.chunkSize * cameraScale,
                        chunks.chunkSize * cameraScale
                    );

                    this.context.fillStyle = 'white';
                    this.context.fillText(chunk.length.toString(),
                        (x * chunks.chunkSize) * cameraScale + cameraOffset.x * cameraScale,
                        (y * chunks.chunkSize) * cameraScale + cameraOffset.y * cameraScale
                    );
                }
            }

            if (tileMap !== null) {
                for (let y = 0; y < tileMap.size.y; y++) {
                    for (let x = 0; x < tileMap.size.x; x++) {
                        const tile = tileMap.tiles[y][x];

                        if (!tile) {
                            continue;
                        }

                        const body = tile.body;
    
                        if (body.solid) {
                            this.context.fillStyle = 'red';
                            this.context.globalAlpha = 0.5;
                            this.context.fillRect(
                                body.position.x * cameraScale + cameraOffset.x * cameraScale,
                                body.position.y * cameraScale + cameraOffset.y * cameraScale,
                                body.size.x * cameraScale,
                                body.size.y * cameraScale
                            );
                        } else if (tile.spriteIndex === Tile.SPIKE) {
                            tile.renderHitbox(this.context, cameraOffset, cameraScale);
                        }
                    }
                }
            }

            this.context.globalAlpha = 1;

            this.drawWorldStateInfo('FPS (avg)', world.fps / world.frames | 0);
            this.drawWorldStateInfo('GameObjects', gameObjects.length);
            this.drawWorldStateInfo('Stage Index', world.stage);
            this.drawWorldStateInfo('Camera');
            this.drawWorldStateInfo('Scale', camera.scale, 1);
            this.drawWorldStateInfo('Offset', cameraOffset, 1);
            this.drawWorldStateInfo('Subject', camera.subject && camera.subject.constructor.name, 1);
            this.drawWorldStateInfo('Shake', camera.isShaking, 2);
            this.drawWorldStateInfo('Duration', camera.shakeDuration / 1000, 3);
            this.drawWorldStateInfo('Intensity', camera.shakeIntensity, 3);
            
            this.drawWorldStateInfo('Physics');
            this.drawWorldStateInfo('Dynamic', physics.bodies.length, 1);
            this.drawWorldStateInfo('Static', physics.bodyChunks.objects.length - physics.bodies.length, 1);
            this.drawWorldStateInfo('Cache', physics.bodyChunks.cache.size, 1);
            
            this.drawWorldStateInfo('TileMap');
            this.drawWorldStateInfo('Tiles', tileMap !== null ? tileMap.totalTiles : '(no tilemap)', 1);
            this.drawWorldStateInfo('Size', tileMap !== null ? tileMap.size : '(no tilemap)', 1);
            this.drawWorldStateInfo('LowerRenderMin', tileMap !== null ? tileMap.renderRangeMin(cameraOffset) : '(no tilemap)', 1);
            this.drawWorldStateInfo('UpperRenderMax', tileMap !== null ? tileMap.renderRangeMax(screenSize, cameraScale) : '(no tilemap)', 1);

            if (player !== null) {
                const playerCenterScreen = player.getScreenPosition(cameraOffset, cameraScale, true);
                const mouseDirection = player.getMouseDirection();

                this.drawWorldStateInfo('Player');
                this.drawWorldStateInfo('Controls Active', !player.controlsLocked, 1);
                this.drawWorldStateInfo('Flamethrower Enabled', player.flamethrower.isActive(), 1);
                this.drawWorldStateInfo('GiftGun Enabled', player.giftGun.isActive(), 1);
                this.drawWorldStateInfo('Can Coyote Jump', player.canCoyote(), 1);
                
                this.drawWorldStateInfo('Firing');
                this.drawWorldStateInfo('Active', player.giftGun.firing() || player.flamethrower.firing(), 2);
                this.drawWorldStateInfo('Emission Velocity', mouseDirection, 3);

                if (!(player.screenMousePosition.equals(new Vector2(-1, -1)))) {
                    const mouseVector = mouseDirection.scale(Constants.TILE_SIZE * cameraScale).add(playerCenterScreen);

                    this.context.strokeStyle = 'red';
                    this.context.beginPath();
                    this.context.moveTo(playerCenterScreen.x, playerCenterScreen.y);
                    this.context.lineTo(mouseVector.x, mouseVector.y)
                    this.context.stroke();

                    const ray = new Ray(player.body.getCenter(), mouseDirection.scale(12 * 5));

                    ray.setFilter((body) => {
                        return body !== player.body;
                    });

                    const result = physics.raycast(ray);

                    if (result.hit !== null) {
                        const solidHit = result.hit;

                        this.context.fillStyle = 'red';
                        this.context.globalAlpha = 0.5;

                        this.context.fillRect(
                            solidHit.position.x * cameraScale + cameraOffset.x * cameraScale,
                            solidHit.position.y * cameraScale + cameraOffset.y * cameraScale,
                            solidHit.size.x * cameraScale,
                            solidHit.size.y * cameraScale
                        );

                        this.drawRay(ray, cameraOffset, cameraScale);
                    }

                    this.context.globalAlpha = 1;
               }
            }

            this.drawWorldStateInfo('AudioContext');
            this.drawWorldStateInfo('Sfx', Sounds.sfxContext.state, 1);
            this.drawWorldStateInfo('Music', Sounds.musicContext.state, 1);
            this.drawWorldStateInfo('Theme', Sounds.currentTheme ? Sounds.currentTheme.src.split('/').pop() : '(no theme)', 1);
            this.drawWorldStateInfo('Active', Sounds.activeSounds.length, 1);

            let totalParticles = 0;

            for (const emitter of particlesManager.emitters) {
                totalParticles += emitter.particles.length;
            }
            
            this.drawWorldStateInfo('MaxFallY', world.maxFallY);
            this.drawWorldStateInfo('Particles');
            this.drawWorldStateInfo('Emitters', particlesManager.emitters.length, 1);
            this.drawWorldStateInfo('Particles', totalParticles, 1);

            this.drawWorldStateInfo('Cursor', world.cursor ? world.cursor.src.split('/').pop() : 'default');
            this.drawWorldStateInfo('UIObjects', world.uiRoot.objects.length);

            this.drawWorldStateInfo('Score');
            this.drawWorldStateInfo('Current', world.score.getScore(), 1);
            this.drawWorldStateInfo('Time', Score.determineTimeBonus(world.elapsedTimeMs / 1000), 1);

            // loop backwards because last elements (older)
            // are less likely to be despawned
            for (let i = gameObjects.length - 1; i >= 0; i--) {
                const gameObject = gameObjects[i];

                this.drawGameObjectInfo(gameObject);
                gameObject.renderHitbox(this.context, cameraOffset, cameraScale);

                if (player !== null) {
                    const playerPos = player.getScreenPosition(cameraOffset, cameraScale, true);
                    const objectPos = gameObject.getScreenPosition(cameraOffset, cameraScale, true);

                    this.context.beginPath();
                    this.context.moveTo(playerPos.x, playerPos.y);
                    this.context.lineTo(objectPos.x, objectPos.y);
                    this.context.strokeStyle = 'yellow';
                    this.context.stroke();
                    this.context.closePath();
                }
            }
        }

        // draws the given ray to the canvas
        drawRay (ray, cameraOffset, cameraScale) {
            const context = this.context;

            context.beginPath();
            context.moveTo(ray.start.x * cameraScale + cameraOffset.x * cameraScale,
                ray.start.y * cameraScale + cameraOffset.y * cameraScale);
            context.lineTo(ray.end.x * cameraScale + cameraOffset.x * cameraScale,
                ray.end.y * cameraScale + cameraOffset.y * cameraScale);
            context.strokeStyle = 'yellow';
            context.globalAlpha = 0.5;
            context.stroke();
            context.closePath();
        }

        // function used for testing that 
        // does various things when called
        static async test (game) {
            const world = game.mainWorld;
            const player = world.player;

            const [existing] = world.gameObjectManager.getGameObjectsByType(Elf);

            if (existing === undefined){
                const playerCenter = player.body.getCenter();
                const spawnPosition = playerCenter.subtract(new Vector2(0, 12 * 5));
    
                const elf = new Elf();
                elf.setPosition(spawnPosition);
                world.spawn(elf);
            } else {
                if (world.camera.subject === null || world.camera.subject === player) {
                    world.camera.track(existing)
                } else {
                    world.camera.track(player);
                }
            }
        }
    }
})();