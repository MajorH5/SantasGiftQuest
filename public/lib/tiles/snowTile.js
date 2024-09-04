import { Tile } from "./tile.js";

export const SnowTile = (function () {
    return class SnowTile extends Tile {
        constructor (solidity, position) {
            super(Tile.SNOW, solidity, position);
        }

        melt () {
            let transparency = this.sprite.transparency - 0.1;

            if (transparency < 0) {
                transparency = 0;
            }

            this.sprite.setTransparency(transparency);
            this.body.solid = transparency >= 0.2;

            return transparency === 0;
        }
    }
})();