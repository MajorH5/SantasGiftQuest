import { Collectable } from './collectable.js';
import { Sounds } from '/lib/sounds/sounds.js';

export const Cookie = (function () {
    // creates a new in world cookie item
    return class Cookie extends Collectable {
        static COOKIE = 48;
        static HEALTH_GAIN = 30;

        constructor (spawnPosition) {
            super(Cookie.COOKIE, spawnPosition);

            this.body.size = this.body.size.scale(0.75);
            this.sprite.size = this.sprite.size.scale(0.75);
        }

        collect (player) {
            if (this.isCollected || player.isDead()) {
                return;
            }

            Sounds.playSfx(Sounds.SND_COOKIE, Sounds.SFX_DEFAULT_VOLUME / 3);
            player.heal(Cookie.HEALTH_GAIN);
            super.collect(player);
        }

        update (deltaTime) {
            super.update(deltaTime);

            this.body.rotation += 0.01 * (this.isCollected ? 5 : 1);
        }
    }
})();