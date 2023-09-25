import { ButtonTile } from "./buttonTile.js";
import { SnowTile } from "./snowTile.js";
import { Tile } from "./tile.js";

export const TileFactory = (function () {
    return class TileFactory {
        static createTile (spriteIndex, solidity, position) {
            let tile = null;

            switch (spriteIndex) {
                case Tile.SNOW:
                    tile = new SnowTile(solidity, position);
                    break;
                case Tile.BUTTON:
                        tile = new ButtonTile(solidity, position);
                    break;
                default:
                    tile = new Tile(spriteIndex, solidity, position);
                    break;
            }

            return tile;
        }
    }
})();