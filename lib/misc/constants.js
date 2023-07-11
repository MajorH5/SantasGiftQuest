import { Vector2 } from "/lib/PhysicsJS2D/src/vector2.js";

export const Constants = (function () {
    return {
        TILE_SIZE: 12 * 5,
        TILE_DEFAULT_SIZE: new Vector2(12 * 5, 12 * 5),
        TILESET_SPRITE_SHEET: '/assets/images/snowytiles.png',
        NPC_0_SPRITE_SHEET: '/assets/images/npcs_0.png',
        SPRITE_SIZE: new Vector2(12, 12),

        DEFAULT_RENDER_PRIORITY: 0,
        TILE_RENDER_PRIORITY: 1,
        TILE_PROMPT_RENDER_PRIORITY: 2,
        COLLECTABLE_RENDER_PRIORITY: 3,
        ENTITY_RENDER_PRIORITY: 4,
        PLAYER_RENDER_PRIORITY: 5,
    }
})();