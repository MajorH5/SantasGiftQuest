import { Vector2 } from "./PhysicsJS2D/src/vector2.js";
import { AnimationPack } from "./animationPack.js";
import { BehaviorNPC } from "./ai/behaviorNPC.js";
import { Constants } from "./constants.js";
import { Animation } from "./animation.js";
import { Entity } from "./entity.js";

export const Reindeer = (function () {
    const REINDEER_HITBOX = new Vector2(35, 50);
    const REINDEER_HITBOX_OFFSET = new Vector2(-10, -10);
    const REINDEER_ANIMATION_PACK = new AnimationPack([
        new Animation('WALK')
            .setFrameSize(12, 12)
            .setBase(0, 72)
            .setFrames([[0, 0], [1, 0]]),

        new Animation('JUMP')
            .setFrameSize(12, 12)
            .setBase(0, 72)
            .setFrames([[2, 0]]),

        new Animation('FALL')
            .setFrameSize(12, 12)
            .setBase(0, 72)
            .setFrames([[2, 0]]),

        new Animation('IDLE')
            .setFrameSize(12, 12)
            .setBase(0, 72)
            .setFrames([[0, 0]]),
    ]);

    return class Reindeer extends Entity {
        static MAX_HEALTH = 100;

        constructor () {
            super(Constants.NPC_0_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: REINDEER_HITBOX
            }, Reindeer.MAX_HEALTH);

            this.acceleration /= 2;
            this.maxSpeed /= 1.6;

            this.body.setTag('npc', this);
            this.setBehavior(new BehaviorNPC(this));
            this.setAnimations(REINDEER_ANIMATION_PACK);
            this.hitboxOffset = REINDEER_HITBOX_OFFSET;
        }
    }
})();