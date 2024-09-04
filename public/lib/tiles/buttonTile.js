import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Tile } from "./tile.js";

export const ButtonTile = (function () {
    return class ButtonTile extends Tile {
        static HITBOX_OFFSET = new Vector2(-15, -50);
        static HITBOX_SIZE = new Vector2(30, 10);

        constructor (solidity, position) {
            super(Tile.BUTTON, solidity, position);

            this.isHeld = false;
            this.totalCollisions = 0;

            this.hitboxOffset = ButtonTile.HITBOX_OFFSET;
            this.body.size = ButtonTile.HITBOX_SIZE;
            this.body.position.y += -this.hitboxOffset.y;
            this.body.position.x += -this.hitboxOffset.x;
        }

        onCollision (body) {
            if (!body.getTag('player')) {
                return;
            }

            this.totalCollisions++;

            this.press();
        }
        
        onCollisionEnd (body) {
            if (!body.getTag('player')) {
                return;
            }

            this.totalCollisions--;

            if (this.totalCollisions <= 0) {
                this.release();
            }
        }

        press () {
            if (this.isHeld) {
                return;
            }

            this.isHeld = true;
            this.sprite.setIndex(Tile.BUTTON_HELD);
        }
        
        release () {
            this.totalCollisions = 0;
            this.isHeld = false;
            this.sprite.setIndex(Tile.BUTTON);
        }
    }
})();