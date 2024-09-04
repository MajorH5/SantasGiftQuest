import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Sprite } from "./sprite.js";

export const ParallaxLayer = (function () {
    return class ParallaxLayer extends Sprite {
        constructor (imageSource, imageSize, parallaxScale = Vector2.one, repeatX = true, repeatY = false) {
            super(imageSource, imageSize);

            this.parallaxScale = parallaxScale;
            this.offset = Vector2.zero;
            this.repeatX = repeatX;
            this.repeatY = repeatY;
        }

        // render (context, offset, scale) {
        //     this.position = new Vector2(0, 0);
            
            
        //     const game = globalThis.game;
            
        //     if (game) {
        //         offset = new Vector2(offset.x, game.constructor.DEFAULT_CANVAS_SIZE.y - this.size.y * scale);                
        //     }
        //     super.render(context, offset, scale);
        // }
    }
})();