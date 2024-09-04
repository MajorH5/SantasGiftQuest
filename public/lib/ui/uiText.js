import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Constants } from "../misc/constants.js";
import { UIBase } from "./uiBase.js";

export const UIText = (function () {
    return class UIText extends UIBase {
        static FONT_PRESS_START_2P = new FontFace('PressStart2P', `url(${Constants.ORIGIN}/assets/fonts/PressStart2P-Regular.ttf)`);
        static GOTHAM = new FontFace('Gotham', `url(${Constants.ORIGIN}/assets/fonts/Gotham-Bold.ttf)`);
        static DEFAULT_FONT = "PressStart2P";

        static {
            const fonts = [
                UIText.FONT_PRESS_START_2P,
                UIText.GOTHAM
            ];

            fonts.forEach(font => {
                font.load().then(font => {
                    document.fonts.add(font);
                });
            });
        }

        // creates a new UI text object
        constructor (text, options) {
            super(options);

            this.text = text;
            this.font = options.font || UIText.DEFAULT_FONT;
            this.fontSize = options.fontSize || 16;
            this.fontColor = options.fontColor || "black";
            this.lineHeight = options.lineHeight || 5;
            this.textTransparency = typeof options.textTransparency === 'number' ? options.textTransparency : 1;

            this.textXAlignment = options.textXAlignment || "center";
            this.textYAlignment = options.textYAlignment || "center";
        }

        // clones the text object
        clone () {
            return new UIText(this.text, this);
        }

        // draws the text to the screen
        render (context, screenSize) {
            super.render(context, screenSize);
            this.renderText(context, screenSize);
        }

        // renders the text to the screen
        renderText (context, screenSize) {
            const rootPosition = this.getScreenPosition(screenSize);
            const size = this.getScreenSize(screenSize);
            const lines = this.text.split("\n");

            const textHeight = this.fontSize * lines.length;
            
            context.font = `${this.fontSize}px ${this.font}`;
            context.fillStyle = this.fontColor;
            context.textAlign = 'left';
            context.globalAlpha = this.textTransparency;

            if (this.shadow) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffset.x;
                context.shadowOffsetY = this.shadowOffset.y;
            }

            for (let i = 0; i < lines.length; i++) {
                const position = new Vector2(rootPosition.x, rootPosition.y + (this.fontSize + this.lineHeight) * i);
                const textWidth = context.measureText(lines[i]).width;

                position.y += this.fontSize;
    
                // align the text on y axis
                if (this.textYAlignment === "center") {
                    position.y += size.y / 2 - textHeight / 2;
                } else if (this.textYAlignment === "bottom") {
                    position.y += size.y - textHeight;
                }

                if (this.textXAlignment === "center") {
                    position.x += size.x / 2 - textWidth / 2;
                } else if (this.textXAlignment === "right") {
                    position.x += size.x - textWidth;
                }

                context.fillText(lines[i], position.x, position.y);
            }

            context.globalAlpha = 1;
            context.shadowColor = "black";
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }
    }
})();