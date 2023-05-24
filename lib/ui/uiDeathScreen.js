import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { ParticlesManager } from '../particlesManager.js';
import { Event } from '../PhysicsJS2D/src/event.js';
import { Sounds } from '../sounds.js';
import { UIBase } from './uiBase.js';
import { UIText } from './uiText.js';

export const UIDeathScreen = (function () {
    return class UIDeathScreen extends UIBase {
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundEnabled: true,
                backgroundColor: 'black',
                visible: false
            });

            this.headerPivot = new UIBase({
                size: new Vector2(50, 50),
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.12)
            });
            this.headerPivot.parentTo(this);

            this.headerText = new UIText('CHRISTMAS IS\nRUINED!', {
                fontSize: 80,
                fontColor: 'white',

                shadow: true,
                shadowBlur: 0,
                shadowColor: '#8F2628',
                shadowOffset: new Vector2(0, 4),

                positionScale: new Vector2(0.5, 0.5),
                pivot: new Vector2(0.5, 0.5)
            });
            this.headerText.parentTo(this.headerPivot);

            this.particlesManager = new ParticlesManager();
            this.splashEmitter = this.particlesManager.createEmitter({
                color: {
                    start: '#EE0F0F',
                    finish: '#EE0F0F'
                },

                size: {
                    start: new Vector2(80, 80),
                    finish: new Vector2(100, 100)
                },

                velocityVariation: new Vector2(30, 20),

                gravity: 1
            });

            const lostTextContent = `Gifts go undelivered.
Children across the
globe wake up the next
morning to barren
christmas trees...`;
            this.lostText = new UIText(lostTextContent, {
                fontSize: 20,
                fontColor: 'white',

                shadow: true,
                shadowOffset: new Vector2(0, 2),
                shadowBlur: 0,
                shadowColor: '#777777',

                textTransparency: 0,

                positionScale: new Vector2(0.5, 0.5)
            });
            this.lostText.parentTo(this);

            this.exitButton = new UIText('OKAY', {
                clickable: true,

                fontSize: 20,
                fontColor: 'white',

                shadow: true,
                shadowColor: '#777777',
                shadowOffset: new Vector2(0, 2),
                shadowBlur: 0,

                borderSize: 3,
                borderColor: 'white',

                size: new Vector2(200, 50),
                textTransparency: 0,
                transparency: 0,

                positionScale: new Vector2(0.5, 1),
                pivot: new Vector2(0.5, 1),
                position: new Vector2(0, -50)
            });
            this.exitButton.parentTo(this);

            this.onMenu = new Event();
            this.exitButton.mouseUp.listen(() => this.onMenu.trigger());

            this.landTime = Infinity;
        }

        reset () {
            this.exitButton.textTransparency = 0;
            this.exitButton.transparency = 0;
            this.lostText.textTransparency = 0;
            this.headerText.fontSize = 80;
            this.landTime = Infinity;
        }

        update (deltaTime) {
            super.update(deltaTime);
            this.particlesManager.update(deltaTime);

            if (this.headerText.fontSize > 30) {
                this.headerText.fontSize = Math.max(this.headerText.fontSize - 7, 30);

                if (this.headerText.fontSize === 30) {
                    Sounds.playSfx(Sounds.SND_EXPLOSION);
                    this.splashEmitter.emit(30);
                    this.landTime = Date.now();
                }
            }

            if (Date.now() - this.landTime > 2000) {
                if (this.exitButton.textTransparency < 1) {
                    this.exitButton.textTransparency = Math.min(this.exitButton.textTransparency + 0.05, 1);
                    this.exitButton.transparency = Math.min(this.exitButton.transparency + 0.05, 1);
                }
    
                if (this.lostText.textTransparency < 1) {
                    this.lostText.textTransparency = Math.min(this.lostText.textTransparency + 0.05, 1);
                }
            }

        }

        render (context, screenSize){
            super.render(context, screenSize);
            this.splashEmitter.properties.position = this.headerPivot.getScreenPosition(screenSize).subtract(new Vector2(75, 75));
            this.particlesManager.render(context, Vector2.zero, 1);
        }
    }
})();