import { ParticlesManager } from "../../particles/particlesManager.js";
import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Constants } from "../../misc/constants.js";
import { Sprite } from "../../sprites/sprite.js";
import { UIImage } from "../uiImage.js";

export const UISleigh = (function () {
    return class UISleigh extends UIImage {
        // creates a new uisleigh object
        constructor (depth) {
            super(Sprite.IMG_SNOWYTILES, {
                imageRectOffset: new Vector2(5, 2).scale(12),
                imageRectSize: Constants.SPRITE_SIZE,
                imageTransparency: depth,
                size: Constants.TILE_DEFAULT_SIZE.scale(depth * 2),
                zIndex: -1
            });
        
            this.depth = depth;
            this.limitLeft = -0.2;
            this.direction = Math.random() < .5 ? -1 : 1;
            this.positionScale = new Vector2(this.direction === -1 ? 1 : this.limitLeft, depth);
            
            this.flippedHorizontal = this.direction === -1;
            this.isDead = false;

            const particleTexture = new Sprite(Sprite.IMG_SNOWYTILES, Constants.TILE_DEFAULT_SIZE.scale(depth));
            particleTexture.transparency = depth;
            particleTexture.setRect(new Vector2(Math.floor(Math.random() * 3), 5).scale(12), Constants.SPRITE_SIZE);

            this.particlesManager = new ParticlesManager();
            this.burstEmitter = this.particlesManager.createEmitter({
                rotation: {
                    start: 0,
                    finish: Math.PI + Math.random() * Math.PI / 3
                },
                opacity: {
                    start: depth,
                    finish: 0
                },
                size: {
                    start: Constants.TILE_DEFAULT_SIZE.scale(depth * 2),
                    finish: Constants.TILE_DEFAULT_SIZE.scale(depth * 2)
                },

                velocity: new Vector2(5 * this.direction * this.depth * 2, -10 * this.depth),
                
                lifetime: 700,
                rate: 1 / (Math.max(Math.random() * 2, 0.5)) * 1000,

                amount: 10,

                sprite: particleTexture,
                position: new Vector2(300, 300),
                gravity: 0.4
            });

            this.burstEmitter.emit(10, true);
        }

        update (deltaTime) {
            super.update(deltaTime);

            this.positionScale.x += (this.direction / 100) * this.depth;

            if (this.direction === -1 && this.positionScale.x < this.limitLeft || this.direction === 1 && this.positionScale.x > 1) {
                this.isDead = true;
                this.visible = false;
            }

            this.particlesManager.update(deltaTime);
        }

        render (context, screenSize) {
            super.render(context, screenSize);
            this.burstEmitter.properties.position = this.getScreenPosition(screenSize)
            this.particlesManager.render(context, Vector2.zero, 1);
        }
    }
})();