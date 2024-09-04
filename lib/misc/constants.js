import { Vector2 } from "../PhysicsJS2D/src/vector2.js";

export const Constants = (function () {
    let origin = location.href;

    if (origin.split('/').at(-1) === 'index.html') {
        origin = origin.substring(0, origin.length - 10);
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const CANVAS_SCALE = 1.2;

    return {
        ORIGIN: origin,
        MOBILE_ENVIRONMENT: isMobile,
        DEV_ENVIRONMENT: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
        TILE_SIZE: 12 * 5,
        TILE_DEFAULT_SIZE: new Vector2(12 * 5, 12 * 5),
        TILESET_SPRITE_SHEET: origin + '/assets/images/snowytiles.png',
        NPC_0_SPRITE_SHEET: origin + '/assets/images/npcs_0.png',
        SPRITE_SIZE: new Vector2(12, 12),

        CANVAS_SCALE,
        DEFAULT_CANVAS_SIZE: new Vector2(900 * CANVAS_SCALE, 600 * CANVAS_SCALE),
        FRAME_RATE_CAP: 1000 / 80,

        DEFAULT_RENDER_PRIORITY: 0,
        TILE_RENDER_PRIORITY: 1,
        TILE_PROMPT_RENDER_PRIORITY: 2,
        COLLECTABLE_RENDER_PRIORITY: 3,
        ENTITY_RENDER_PRIORITY: 4,
        PROJECTILE_RENDER_PRIORITY: 5,
        PLAYER_RENDER_PRIORITY: 6,
    }
})();