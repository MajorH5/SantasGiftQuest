import { Collectable } from './collectable.js';
import { Sounds } from '../../../sounds/sounds.js';

export const Cookie = (function () {
    // creates a new in world cookie item
    return class Cookie extends Collectable {
        static COOKIE = 48;
        static HEALTH_GAIN = 30;
        static DESPAWN_TIME = 5 * 1000;

        constructor (spawnPosition, shouldDespawn = false) {
            super(Cookie.COOKIE, spawnPosition);

            this.body.size = this.body.size.scale(0.75);
            this.sprite.size = this.sprite.size.scale(0.75);
            this.shouldDespawn = shouldDespawn;
            this.timeTillDespawn = shouldDespawn ? Cookie.DESPAWN_TIME : -1;
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

            if (this.shouldDespawn && !this.isCollected) {
                this.timeTillDespawn -= deltaTime;

                if (this.timeTillDespawn <= 0) {
                    this.despawn();
                } else if (this.timeTillDespawn <= 1000) {
                    this.sprite.setTransparency(this.timeTillDespawn  % 200 < 50 ? 0.5 : 1);
                }
            }
        }
    }
})();