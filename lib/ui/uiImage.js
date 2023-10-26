import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Sprite } from "../sprites/sprite.js";
import { UIBase } from "./uiBase.js";

export const UIImage = (function () {
    return class UIImage extends UIBase {
        // creates a new UI image object
        constructor (imageSrc, options) {
            super(options);

            this.src = imageSrc;
            this.sprite = new Sprite(imageSrc);

            this.imageSize = options.imageSize || this.sprite.size;
            this.imageRectSize = options.imageRectSize || this.imageSize;
            this.imageRectOffset = options.imageRectOffset || Vector2.zero;
            this.imageTransparency = options.imageTransparency || 1;
            this.imageSmoothingEnabled = options.imageSmoothingEnabled || false;
            this.flippedHorizontal = options.flippedHorizontal || false;
            this.flippedVertical = options.flippedVertical || false;
        }

        // updates the image
        update (deltaTime) {
            super.update(deltaTime);

            this.sprite.setRect(this.imageRectOffset, this.imageRectSize);
            this.sprite.flipHorizontal(this.flippedHorizontal);
            this.sprite.flipVertical(this.flippedVertical);
            this.sprite.setTransparency(this.imageTransparency);
            this.sprite.setImageSmoothing(this.imageSmoothingEnabled);
        }

        // draws the image to the screen
        render (context, screenSize) {
            this.renderImage(context, screenSize);
            super.render(context, screenSize);
        }

        // renders the image to the screen
        renderImage (context, screenSize) {
            this.sprite.setPosition(this.getScreenPosition(screenSize));
            this.sprite.setSize(this.getScreenSize(screenSize));
            this.sprite.render(context, Vector2.zero, 1);
        }
    }
})();