import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Constants } from '../misc/constants.js';

export const Sprite = (function () {
    return class Sprite {
        static IMAGE_CACHE = {};

        static IMG_SNOWYTILES = Constants.TILESET_SPRITE_SHEET;
        static IMG_NPC_0 = Constants.NPC_0_SPRITE_SHEET;
        static IMG_ICONS = Constants.ORIGIN + '/assets/images/icons.png';
        static IMG_CROSSHAIR_CLOSED = Constants.ORIGIN + '/assets/images/crosshair_closed.png';
        static IMG_CROSSHAIR_OPEN = Constants.ORIGIN + '/assets/images/crosshair_open.png';
        static IMG_PANEL = Constants.ORIGIN + '/assets/images/panel.png';

        // creates a new sprite image from the given
        // asset location
        constructor (imageSource, imageSize) {
            this.source = imageSource || null;
            this.image = null;

            // orientation states of the sprite
            this.isFlippedHorizontal = false;
            this.isFlippedVertical = false;

            // size of the full image and its current position
            this.size = imageSize || Vector2.zero;
            this.position = new Vector2(0, 0);
            
            // size and offset of rect to draw from image
            this.imageRectSize = new Vector2(0, 0);
            this.imageRectOffset = new Vector2(0, 0);

            this.imageSmoothingEnabled = false;

            this.rotation = 0;
            this.transparency = 1;
            this.visible = true;

            if (imageSource) {
                this.loadImage(imageSource);
            }
        }

        // preloads all the images for the game
        static async preloadAll () {
            return Promise.all([
                Sprite.getImage(Sprite.IMG_SNOWYTILES),
                Sprite.getImage(Sprite.IMG_ICONS),
                Sprite.getImage(Sprite.IMG_CROSSHAIR_CLOSED),
                Sprite.getImage(Sprite.IMG_CROSSHAIR_OPEN),
                Sprite.getImage(Sprite.IMG_PANEL),
                Sprite.getImage(Sprite.IMG_NPC_0)
            ]);
        }

        // caches a given image url
        static cacheImage (url, image) {
            Sprite.IMAGE_CACHE[url] = image;
        }

        // returns a cached image url
        static getCachedImage (source) {
            const url = new URL(source, window.location.href);
            return Sprite.IMAGE_CACHE[url.href] || null;
        }

        // loads the image from the given source
        static async getImage (source) {
            const url = new URL(source, window.location.href);
            const image = Sprite.getCachedImage(url.href);

            if (image) {
                return image;
            }

            const newImage = new Image();
            newImage.src = source;
            
            return new Promise((resolve, reject) => {
                newImage.onload = () => {
                    Sprite.cacheImage(url.href, newImage);
                    resolve(newImage);
                };
                newImage.onerror = () => {
                    console.trace();
                    reject(new Error(`Failed to load image: ${source}`));
                };
            });
        }

        // loads the given image to the sprite
        async loadImage (source) {
            const url = new URL(source, window.location.href);

            let img = Sprite.getCachedImage(url.href) || await Sprite.getImage(source);
            
            if (img === null) {
                this.image = null;
                return;
            }

            this.image = img;
            this.source = source;

            if (this.size.equals(Vector2.zero)) {
                this.size = new Vector2(img.width, img.height);
            }
        }

        // draws the sprite to the given context at the given position
        render (context, offset, scale) {
            if (this.image === null) {
                console.warn('Render call failed, image not loaded!');
                return;
            }

            if (!this.visible) {
                return;
            }

            context.imageSmoothingEnabled = this.imageSmoothingEnabled;
            
            // save the current context state
            context.save();

            const translation = new Vector2(
                (this.position.x * scale + offset.x * scale) + this.size.x * scale / 2,
                (this.position.y * scale + offset.y * scale) + this.size.y * scale / 2
            );

            const renderPosition = new Vector2(
                -this.size.x / 2 * scale,
                -this.size.y / 2 * scale,
            );

            const renderSize = new Vector2(
                this.size.x * scale,
                this.size.y * scale
            );

            // translate the context to the sprite's position
            context.translate(translation.x, translation.y);

            // rotate the context to the sprite's rotation
            context.rotate(this.rotation);

            // scale the context to the sprite's scale
            context.scale(this.isFlippedHorizontal ? -1 : 1, this.isFlippedVertical ? -1 : 1);

            context.globalAlpha = this.transparency;

            // draw the sprite's image to the context
            context.drawImage(
                this.image,
                this.imageRectOffset.x,
                this.imageRectOffset.y,
                this.imageRectSize.x,
                this.imageRectSize.y,
                renderPosition.x,
                renderPosition.y,
                renderSize.x,
                renderSize.y
            );

            // restore the context state
            context.restore();

            context.globalAlpha = 1;
        }

        // sets the texture of the collectable
        setIndex (index, columns = 8) {
            const spriteX = index % columns;
            const spriteY = Math.floor(index / columns);

            this.setRect(new Vector2(Constants.SPRITE_SIZE.x * spriteX, Constants.SPRITE_SIZE.y * spriteY),
                Constants.SPRITE_SIZE);
        }

        // horizontally flips the sprite
        flipHorizontal (isFlipped) {
            this.isFlippedHorizontal = isFlipped;
        }

        // vertically flips the sprite
        flipVertical (isFlipped) {
            this.isFlippedVertical = isFlipped;
        }

        // sets the size of the sprite
        setSize (size) {
            this.size = size;
        }

        // sets image rect data of the sprite
        setRect (offset, size) {
            this.imageRectOffset = offset;
            this.imageRectSize = size;
        }

        // sets the position of the sprite
        setPosition (position) {
            this.position = position;
        }

        // sets the rotation of the sprite
        setRotation (rotation) {
            this.rotation = rotation;
        }

        // sets the visibility of the sprite
        setVisible (visible) {
            this.visible = visible;
        }

        // sets the transparency of the sprite
        setTransparency (transparency) {
            this.transparency = transparency;
        }

        // sets the image smoothing
        setImageSmoothing (imageSmoothingEnabled) {
            this.imageSmoothingEnabled = imageSmoothingEnabled;
        }

        // makes the sprite visible
        show () {
            this.visible = true;
        }

        // makes the sprite invisible
        hide () {
            this.visible = false;
        }
    }
})();