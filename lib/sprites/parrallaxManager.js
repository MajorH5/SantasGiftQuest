import { Vector2 } from "../PhysicsJS2D/src/vector2.js";

export const ParallaxManager = (function () {
    return class ParallaxManager {
        constructor (scale) {
            this.scale = scale || 1;
            this.parallaxScale = Vector2.one;
            this.scroll = 0;
            this.layers = [];
        }

        addLayer (layer) {
            this.layers.push(layer);
        }

        removeLayer (layer) {
            const index = this.layers.indexOf(layer);

            if (index !== -1) {
                this.layers.splice(index, 1);
            }
        }

        getLayers () {
            return this.layers;
        }

        update (deltaTime) {
            for (let i = 0; i < this.layers.length; i++) {
                // layer.update(deltaTime);
            }
        }

        
        render (context, offset, scale) {
            for (let i = 0; i < this.layers.length; i++) {
                const layer = this.layers[i];
                
                const layerParallax = this.parallaxScale.multiply(layer.parallaxScale);
                const layerOffset = offset.multiply(layerParallax);
                const layerScale = this.scale * scale;


                if (layer.repeatX) {
                    let layerOffsetX = layerOffset.x;
                    const layerWidth = layer.size.x;

                    layerOffsetX = -layerWidth + (layerOffsetX % layerWidth);
                    let drawn = 0

                    while (layerOffsetX < context.canvas.width * (1 / scale)) {
                        drawn++
                        layer.render(context, new Vector2(layerOffsetX, layerOffset.y), layerScale);
                        layerOffsetX += layerWidth;
                    }
                }
            }
        }
    }
})();