import { Penguin } from "/lib/world/gameobjects/entities/enemies/penguin.js";
import { Grinch } from "/lib/world/gameobjects/entities/enemies/grinch.js";
import { Cookie } from "/lib/world/gameobjects/collectables/cookie.js";
import { Gift } from "/lib/world/gameobjects/collectables/gift.js";
import { Tree } from "/lib/world/gameobjects/collectables/tree.js";
import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";
import { Constants } from "/lib/misc/constants.js";
import { Levels } from "/lib/misc/levels.js";
import { Tile } from "./tile.js";

export const TileMap = (function () {
    return class TileMap {
        // creates a new tile map from the given source
        constructor (levelIndex = null) {
            this.source = levelIndex;
            this.tiles = [];
            this.snowTiles = [];
            this.gameObjects = [];
            this.renderOffset = new Vector2(0, 0);
            this.spawnLocation = new Vector2(0, 0);
            this.size = new Vector2(0, 0);
            this.totalTiles = 0;

            this.redGiftCount = 0;
            this.greenGiftCount = 0;
            this.yellowGiftCount = 0;

            this.redGiftMax = 0;
            this.greenGiftMax = 0;
            this.yellowGiftMax = 0;
        }

        // clears all tiles and game objects
        clear () {
            this.tiles = [];
            this.snowTiles = [];
            this.gameObjects = [];

            this.spawnLocation = new Vector2(0, 0);
            this.size = new Vector2(0, 0);
            this.totalTiles = 0;

            this.redGiftCount = 0;
            this.greenGiftCount = 0;
            this.yellowGiftCount = 0;

            this.redGiftMax = 0;
            this.greenGiftMax = 0;
            this.yellowGiftMax = 0;
        }

        // determines if a tile index should spawn a gameObject
        static shouldSpawnGameObject (tileIndex) {
            return tileIndex === Tile.PENGUIN ||
                tileIndex === Tile.RED_GIFT ||
                tileIndex === Tile.GREEN_GIFT ||
                tileIndex === Tile.YELLOW_GIFT ||
                tileIndex === Tile.CHRISTMAS_TREE ||
                tileIndex === Tile.GRINCH ||
                tileIndex === Tile.COOKIE;
        }

        // loads the tile map from the given source
        async load () {
            if (this.source === null) {
                console.error('No level specified for tile map');
                return false;
            }

            const mapData = await Levels.getLevelData(this.source);

            if (mapData === null) {
                console.error(`Failed to load tile map data for level: ${this.source}`);
                return false;
            }

            // clear the current tiles and objects
            this.clear();

            let layersY = mapData.length;
            let layersX = mapData[0].length;

            for (let y = 0; y < layersY; y++) {
                this.tiles[y] = [];
                for (let x = 0; x < layersX; x++) {
                    let [tileIndex, isSolid, signText] = mapData[y][x];

                    if (tileIndex === undefined){
                        continue;
                    }

                    if (tileIndex === Tile.SIGN && signText === undefined) {
                        // fall back to the sign text from the level data
                        signText = Levels.getSignText(this.source, new Vector2(x, y));
                    }

                    const tileWorldPosition = new Vector2(x * Constants.TILE_SIZE, y * Constants.TILE_SIZE);
                    
                    if (tileIndex === Tile.SPAWN_LOCATION) {
                        // ignore this tile
                        this.spawnLocation = tileWorldPosition;
                    } else if (TileMap.shouldSpawnGameObject(tileIndex)) {
                        // spawn a gameObject
                        this.loadGameObject(tileIndex, tileWorldPosition);
                    } else {
                        // regular tile
                        const tile = new Tile(tileIndex, isSolid, tileWorldPosition);

                        if (signText !== undefined) {
                            tile.setPromptText(signText);
                        }

                        this.tiles[y][x] = tile;

                        if (tileIndex === Tile.SNOW) {
                            this.snowTiles.push(tile);
                        }

                        this.totalTiles++;
                    }
                }
            }

            this.size = new Vector2(layersX, layersY);

            this.redGiftMax = this.redGiftCount;
            this.greenGiftMax = this.greenGiftCount;
            this.yellowGiftMax = this.yellowGiftCount;

            return true;
        }

        // returns the ratio of red gift tiles collected
        getRedGiftRatio () {
            if (this.redGiftMax === 0)
                return 0;

            return (this.redGiftMax - this.redGiftCount) / this.redGiftMax;
        }

        // returns the ratio of green gift tiles collected
        getGreenGiftRatio () {
            if (this.greenGiftMax === 0)
                return 0;

            return (this.greenGiftMax - this.greenGiftCount) / this.greenGiftMax;
        }

        // returns the ratio of yellow gift tiles collected
        getYellowGiftRatio () {
            if (this.yellowGiftMax === 0)
                return 0;

            return (this.yellowGiftMax - this.yellowGiftCount) / this.yellowGiftMax;
        }

        // returns the total ammount of remaning gifts
        getGiftCount () {
            return this.redGiftCount + this.greenGiftCount + this.yellowGiftCount;
        }

        // removes the tile at the given x, y position
        removeTile (x, y) {
            if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y) {
                return;
            }

            const tile = this.tiles[y][x];

            if (!tile) {
                return;
            }

            const index = this.snowTiles.findIndex(snowTile => snowTile === tile);

            if (index !== -1) {
                this.snowTiles.splice(index, 1);
            }

            this.tiles[y][x] = null;

            this.totalTiles--;
        }
        
        // returns the tile at the x, y localized position
        getTile (x, y) {
            if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y) {
                return null;
            }

            return this.tiles[y][x] || null;
        }

        // sets the tile at the x, y localized position
        setTile (x, y, tile) {
            if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y) {
                return;
            }

            this.tiles[y][x] = tile;
        }

        // sets the size of the tile map
        setSize (size) {
            this.clear();

            for (let y = 0; y < size.y; y++) {
                this.tiles[y] = [];
            }

            this.size = size;
        }

        // returns the tile at the specified position
        // alligns the position to the nearest tile (floor)
        getTileAt (position) {
            const tileX = Math.floor(position.x / Constants.TILE_SIZE);
            const tileY = Math.floor(position.y / Constants.TILE_SIZE);

            return this.getTile(tileX, tileY);
        }

        // returns the first tile encountered with the
        // specified tile index
        getTileByIndex (tileIndex) {
            for (let y = 0; y < this.size.y; y++) {
                for (let x = 0; x < this.size.x; x++) {
                    if (this.tiles[y][x] && this.tiles[y][x].spriteIndex === tileIndex) {
                        return this.tiles[y][x];
                    }
                }
            }

            return null;
        }

        // returns the spawning location for the tile map
        getSpawnLocation () {
            return this.spawnLocation;
        }

        // loads a gameObject of type at the given position
        // does not yet add it to the world
        loadGameObject (type, position) {
            let gameObject = null;

            if (type === Tile.RED_GIFT) {
                this.redGiftCount++;
            } else if (type === Tile.GREEN_GIFT) {
                this.greenGiftCount++;
            } else if (type === Tile.YELLOW_GIFT) {
                this.yellowGiftCount++;
            }

            switch (type) {
                case Tile.PENGUIN:
                    gameObject = new Penguin(position);
                    break;
                case Tile.RED_GIFT:
                case Tile.GREEN_GIFT:
                case Tile.YELLOW_GIFT:
                    gameObject = new Gift(type, position);

                    gameObject.collected.listen(() => {
                        if (type === Tile.RED_GIFT) {
                            this.redGiftCount--;
                        } else if (type === Tile.GREEN_GIFT) {
                            this.greenGiftCount--;
                        } else if (type === Tile.YELLOW_GIFT) {
                            this.yellowGiftCount--;
                        } 
                    });
                    break;
                case Tile.CHRISTMAS_TREE:
                    gameObject = new Tree(position);
                    break;
                case Tile.GRINCH:
                    gameObject = new Grinch(position);
                    break;
                case Tile.COOKIE:
                    gameObject = new Cookie(position);
                    break;
                default:
                    console.warn(`Unknown tile index for gameObject: ${type}`);
                    break;
            }

            if (gameObject !== null) {
                this.gameObjects.push(gameObject);
            }
        }

        // adds all the gameObjects within this tilemap
        // into the given world simulation
        spawnGameObjects (world) {
            for (let i = 0; i < this.gameObjects.length; i++) {
                world.spawn(this.gameObjects[i]);
            }
            
            this.gameObjects = [];
        }

        // loads the tiles of this tilemap
        // into the given world simulation
        materialize (world) {
            for (let y = 0; y < this.size.y; y++) {
                for (let x = 0; x < this.size.x; x++) {
                    if (this.tiles[y][x]) {
                        world.physics.addBody(this.tiles[y][x].body, true);
                    }
                }
            }
        }

        // returns the lowest rendering bounds of the tile map
        renderRangeMin (offset) {
            let x = Math.floor(-offset.x / Constants.TILE_SIZE);
            let y = Math.floor(-offset.y / Constants.TILE_SIZE);

            x = Math.max(0, x);
            y = Math.max(0, y);

            return new Vector2(x, y);
        }

        // returns the upper rendering bounds of the tile map
        renderRangeMax (screenSize, scale) {
            let width = Math.ceil(screenSize.x / Constants.TILE_SIZE * (1 / scale));
            let height = Math.ceil(screenSize.y / Constants.TILE_SIZE  * (1 / scale));

            width = Math.min(this.size.x, width);
            height = Math.min(this.size.y, height);

            return new Vector2(width, height);
        }
        
        // draws the tile map to the given context at the given position
        // only draws the tiles that are within the view of the camera
        render (context, offset, scale) {
            offset = offset.add(this.renderOffset);
            
            const screenSize = new Vector2(context.canvas.width, context.canvas.height);

            const min = this.renderRangeMin(offset);
            const max = this.renderRangeMax(screenSize, scale);

            let limitX = Math.max(min.x + max.x, this.size.x);
            let limitY = Math.max(min.y + max.y, this.size.y);

            for (let i = min.y; i <= limitY; i++) {
                for (let j = min.x; j <= limitX; j++) {
                    if (this.tiles[i] && this.tiles[i][j]) {
                        this.tiles[i][j].update();
                        this.tiles[i][j].render(context, offset, scale);
                    }
                }
            }
        }

        // performs a ray cast at the given position
        // returns the first tile encountered
        rayCast (position, direction, distance, filterFn) {
            if (filterFn === undefined) {
                filterFn = (tile) => tile.body.solid || tile.body.semiSolid;
            }

            const tileX = Math.floor(position.x / Constants.TILE_SIZE);
            const tileY = Math.floor(position.y / Constants.TILE_SIZE);

            const tile = this.getTile(tileX, tileY);

            if (tile && filterFn(tile)) {
                return tile;
            }

            let rayX = Math.floor(position.x / Constants.TILE_SIZE),
                rayY = Math.floor(position.y / Constants.TILE_SIZE);

            let stepX = Math.sign(direction.x),
                stepY = Math.sign(direction.y);

            let tMaxX = 0;
            let tMaxY = 0;

            if (stepX === -1) {
                tMaxX = (rayX * Constants.TILE_SIZE - position.x) / direction.x;
            } else {
                tMaxX = ((rayX + 1) * Constants.TILE_SIZE - position.x) / direction.x;
            }

            if (stepY === -1) {
                tMaxY = (rayY * Constants.TILE_SIZE - position.y) / direction.y;
            } else {
                tMaxY = ((rayY + 1) * Constants.TILE_SIZE - position.y) / direction.y;
            }

            let tDeltaX = Math.abs(Constants.TILE_SIZE / direction.x);
            let tDeltaY = Math.abs(Constants.TILE_SIZE / direction.y);

            while (true) {
                if (tMaxX < tMaxY) {
                    tMaxX += tDeltaX;
                    rayX += stepX;
                } else {
                    tMaxY += tDeltaY;
                    rayY += stepY;
                }

                if (rayX < 0 || rayX >= this.size.x || rayY < 0 || rayY >= this.size.y) {
                    break;
                }

                const rayPosition = new Vector2(rayX, rayY).scale(Constants.TILE_SIZE);

                if (Math.abs(rayPosition.x - position.x) > distance || Math.abs(rayPosition.y - position.y) > distance) {
                    break;
                }

                const tile = this.getTile(rayX, rayY);

                if (tile && filterFn(tile)) {
                    return tile;
                }
            }

            return null;
        }
    }
})();