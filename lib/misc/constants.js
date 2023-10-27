import { Vector2 } from "../PhysicsJS2D/src/vector2.js";

export const Constants = (function () {
    let origin = location.href;

    if (origin.split('/').at(-1) === 'index.html') {
        origin = origin.substring(0, origin.length - 10);
    }

    return {
        ORIGIN: origin,
        TILE_SIZE: 12 * 5,
        TILE_DEFAULT_SIZE: new Vector2(12 * 5, 12 * 5),
        TILESET_SPRITE_SHEET: origin + '/assets/images/snowytiles.png',
        NPC_0_SPRITE_SHEET: origin + '/assets/images/npcs_0.png',
        SPRITE_SIZE: new Vector2(12, 12),

        DEFAULT_RENDER_PRIORITY: 0,
        TILE_RENDER_PRIORITY: 1,
        TILE_PROMPT_RENDER_PRIORITY: 2,
        COLLECTABLE_RENDER_PRIORITY: 3,
        ENTITY_RENDER_PRIORITY: 4,
        PLAYER_RENDER_PRIORITY: 5,
    }
})();