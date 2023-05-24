import { Collectable } from "./collectable.js";
import { Sounds } from "./sounds.js";

export const Gift = (function () {
    return class Gift extends Collectable {
        static RED = 40;
        static GREEN = 41;
        static YELLOW = 42;
        static COLLECTED = 43;

        // creates a new gift object of the given index
        constructor (spriteIndex, spawnPosition) {
            super(spriteIndex, spawnPosition, Gift.COLLECTED);
        }

        // collects the given gift
        collect () {
            if (this.isCollected) {
                return;
            }
            
            super.collect();
            Sounds.playSfx(Sounds.SND_GIFT_COLLECT);

            if (this.world) {
                this.world.score.increment('presentsCollected');
            }
        }
    }
})();