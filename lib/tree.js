import { Collectable } from "./collectable.js";
import { Sounds } from "./sounds.js";

export const Tree = (function () {
    return class Tree extends Collectable {
        static TREE = 44;

        // creates a new tree object of the given index
        constructor (spawnPosition) {
            super(Tree.TREE, spawnPosition);
        }

        // collects the given tree
        collect () {
            if (this.isCollected) {
                return;
            }

            super.collect();
            Sounds.playSfx(Sounds.SND_TREE_COLLECT);

            if (this.world) {
                this.world.score.increment('treesCollected');
            }
        }
    }
})();