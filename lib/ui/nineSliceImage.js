import { UIImage } from './uiImage.js';

export const NineSliceImage = (function () {
    return class NineSliceImage extends UIImage {
        constructor (image, options) {
            super(image, options);
            
            this.sliceSize = options.sliceSize || this.imageSize.x / 3;
            
            const s = this.sliceSize;
            
            const SECTIONS_DEFAULT = [
                [0, 0, s, s],
                [s, 0, s, s],
                [s * 2, 0, s, s],
                [0, s, s, s],
                [s, s, s, s],
                [s * 2, s, s, s],
                [0, s * 2, s, s],
                [s, s * 2, s, s],
                [s * 2, s * 2, s, s]
            ];
            this.sections = options.sections || SECTIONS_DEFAULT;
            this.imageScale = options.imageScale || 1;
        }

        // renders the image to the canvas
        renderImage (context, screenSize) {
            const screenPosition = this.getScreenPosition(screenSize);
            const sizeOnScreen = this.getScreenSize(screenSize);

            const image = this.sprite.image;
            const sections = this.sections;
            const s = this.sliceSize;

            // get the sections
            const [part1, part2, part3, part4, part5, part6, part7, part8, part9] = sections;

            context.imageSmoothingEnabled = this.imageSmoothingEnabled;

            context.save();
            
            // set the scale
            
            context.translate(screenPosition.x, screenPosition.y);
            context.scale(this.imageScale, this.imageScale);
            
            // modified code from: https://blog.simonjaeger.ch/implementing-9-slice-scaling-with-the-canvas-api
            // draw the corners
            context.drawImage(image, ...part1, 0, 0, s, s) // top left
            context.drawImage(image, ...part3, sizeOnScreen.x - s, 0, s, s) // top right
            context.drawImage(image, ...part7, 0, sizeOnScreen.y - s, s, s) // bottom left
            context.drawImage(image, ...part9, sizeOnScreen.x - s, sizeOnScreen.y - s, s, s) // bottom right

            // draw the edges
            context.drawImage(image, ...part2, s, 0, sizeOnScreen.x - 2 * s, s) // top
            context.drawImage(image, ...part8, s, sizeOnScreen.y - s, sizeOnScreen.x - 2 * s, s) // bottom
            context.drawImage(image, ...part4, 0, s, s, sizeOnScreen.y - 2 * s) // left
            context.drawImage(image, ...part6, sizeOnScreen.x - s, s, s, sizeOnScreen.y - 2 * s) // right

            // draw the center
            context.drawImage(image, ...part5, s, s, sizeOnScreen.x - 2 * s, sizeOnScreen.y - 2 * s);

            context.translate(-screenPosition.x, -screenPosition.y);

            context.restore();
        }
    }
})();