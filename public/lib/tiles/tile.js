import { GameObject } from '../world/gameobjects/gameObject.js';
import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Constants } from '../misc/constants.js';

export const Tile = (function () {
    return class Tile extends GameObject {
        static RED_GIFT = 40;
        static GREEN_GIFT = 41;
        static YELLOW_GIFT = 42;
        static GIFT_COLLECTED = 43;
        static CHRISTMAS_TREE = 44;
        static COOKIE = 48;
        static LADDER = 35;
        static SLEIGH = 21;
        static SIGN = 20;
        static SPAWN_LOCATION = 3;
        static PENGUIN = 11;
        static GRINCH = 6;
        static SNOW = 39;
        static SNOWMAN = 45;
        static SPIKE = 19;
        static SNOWY_SEMISOLID = 34;
        static BUTTON = 82;
        static BUTTON_HELD = 83;

        static SPIKE_HITBOX_OFFSET = new Vector2(0, -20);
        static SPIKE_HITBOX_SIZE = new Vector2(Constants.TILE_SIZE, 40);
        static SPIKE_DAMAGE = 12;

        // creates a new tile object
        constructor (spriteIndex, isSolid, tilePosition) {
            let isSemiSolid = !isSolid && (spriteIndex === 26 || spriteIndex === 27 || spriteIndex === 34);

            super(Constants.TILESET_SPRITE_SHEET, Constants.TILE_DEFAULT_SIZE, {
                position: tilePosition,
                size: Constants.TILE_DEFAULT_SIZE,
                solid: isSolid,
                semiSolid: isSemiSolid,
                ignoreGravity: true,
            });

            const spriteIndexX = spriteIndex % 8;
            const spriteIndexY = Math.floor(spriteIndex / 8);
            const rectOffset = new Vector2(spriteIndexX * 12, spriteIndexY * 12);
            
            this.body.setTag('tile', this);
            this.sprite.setRect(rectOffset, Constants.SPRITE_SIZE);

            this.spriteIndex = spriteIndex;
            this.promptText = null;
            this.promptVisible = false;
            this.localPosition = tilePosition.div(Constants.TILE_SIZE);

            if (spriteIndex === Tile.LADDER) {
                this.body.setTag('climbable');
            } else if (spriteIndex === Tile.SPIKE) {
                // clean up the hitbox for the spikes so
                // its not so janky
                this.hitboxOffset = Tile.SPIKE_HITBOX_OFFSET;
                this.body.size = Tile.SPIKE_HITBOX_SIZE;
                this.body.position.y += -this.hitboxOffset.y;
            } else if (this.spriteIndex === Tile.SLEIGH){
                this.promptText = 'Collect all the presents to proceed.'
            } else if (this.spriteIndex === Tile.SIGN) {
                this.promptText = 'Welcome to Santa\'s Gift Quest!'
            }

            this.renderPriority = this.promptText !== null ? Constants.TILE_PROMPT_RENDER_PRIORITY : Constants.TILE_RENDER_PRIORITY;
        }        

        // returns true if the tile is of
        // the given type
        isType (type) {
            return this.spriteIndex === type;
        }

        // toggles the tile's prompt
        togglePrompt (visible) {
            this.promptVisible = visible;
        }
        
        // sets the tile's prompt text
        setPromptText (text) {
            this.promptText = text;
            this.renderPriority = Constants.TILE_PROMPT_RENDER_PRIORITY
        }

        // draws the prompt square above the tile
        drawPrompt (context, offset, scale) {
            const padding = new Vector2(30, 34);
            const topOffset = 20 + padding.y / 2;
            const fontSize = 15;
            let textWidth = 0;

            context.font = fontSize + 'px Arial';
            
            // draw the prompt text
            const lines = this.promptText.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                textWidth = Math.max(textWidth, context.measureText(lines[i]).width);
            }
            
            context.font = (fontSize * scale) + 'px Arial';

            const tileSize = this.body.size;
            const tilePosition = this.body.position.add(offset).add(new Vector2(tileSize.x / 2 - textWidth / 2, 0));

            let rectPosition = new Vector2(tilePosition.x - padding.x / 2, tilePosition.y - padding.y / 2 - topOffset - lines.length * fontSize);
            let rectSize = new Vector2(textWidth + padding.x, padding.y + lines.length * fontSize);

            rectPosition = rectPosition.scale(scale);
            rectSize = rectSize.scale(scale);

            // draw the prompt square
            context.fillStyle = '#000000';
            context.fillRect(rectPosition.x, rectPosition.y, rectSize.x, rectSize.y);
            
            // draw the prompt square border
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2;
            context.strokeRect(rectPosition.x, rectPosition.y, rectSize.x, rectSize.y);
            context.moveTo(0, 0);

            for (let i = 0; i < lines.length; i++) {
                context.fillStyle = '#ffffff';
                context.textAlign = 'center';
                context.fillText(lines[i], textWidth / 2 + tilePosition.x * scale,
                    (tilePosition.y - topOffset + fontSize + i * fontSize) * scale - lines.length * fontSize)
            }
        }

        // draws the tile to the given context at the given position
        render (context, offset, scale) {
            super.render(context, offset, scale);

            if (this.promptVisible) {
                this.drawPrompt(context, offset, scale);
            }
        }

    }
})();