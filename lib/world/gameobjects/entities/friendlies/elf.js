import { BehaviorNPC } from "../../../../ai/behaviors/behaviorNPC.js";
import { AnimationPack } from "../../../../sprites/animationPack.js";
import { Vector2 } from "../../../../PhysicsJS2D/src/vector2.js";
import { Animation } from "../../../../sprites/animation.js";
import { Constants } from "../../../../misc/constants.js";
import { Entity } from "../entity.js";

export const Elf = (function () {
    const ELF_HITBOX = new Vector2(35, 50);
    const ELF_HITBOX_OFFSET = new Vector2(-10, -10);
    const ELF_ANIMATION_PACK = new AnimationPack([
        new Animation('WALK')
            .setFrameSize(12, 12)
            .setBase(0, 60)
            .setFrames([[0, 0], [1, 0]]),

        new Animation('JUMP')
            .setFrameSize(12, 12)
            .setBase(0, 60)
            .setFrames([[2, 0]]),

        new Animation('FALL')
            .setFrameSize(12, 12)
            .setBase(0, 60)
            .setFrames([[2, 0]]),

        new Animation('IDLE')
            .setFrameSize(12, 12)
            .setBase(0, 60)
            .setFrames([[0, 0]]),
    ]);

    return class Elf extends Entity {
        static MAX_HEALTH = 100;

        constructor () {
            super(Constants.NPC_0_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                size: ELF_HITBOX
            }, Elf.MAX_HEALTH);

            this.acceleration /= 1.3;

            this.body.setTag('npc', this);
            this.setBehavior(new BehaviorNPC(this));
            this.setAnimations(ELF_ANIMATION_PACK);
            this.hitboxOffset = ELF_HITBOX_OFFSET;
        }
    }
})();