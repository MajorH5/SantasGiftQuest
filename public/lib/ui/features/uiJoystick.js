import { UIBase } from '../uiBase.js';
import { Event } from '../../PhysicsJS2D/src/event.js';
import { Vector2 } from '../../PhysicsJS2D/src/vector2.js';
import { UIText } from '../uiText.js';

export const UIJoystick = (function () {
    return class UIJoystick extends UIBase {
        constructor (scale = 1, positionAbsolute = Vector2.zero, positionScale = Vector2.zero) {
            super({
                pivot: new Vector2(0.5, 0.5),
                positionScale: positionScale,
                position: positionAbsolute,
                size: new Vector2(150, 150),
            });

            this.upArrow = new UIText('↑', {
                positionScale: new Vector2(0.5, 0.3),
                pivot: new Vector2(0.5, 0.5),
                position: new Vector2(4, 0),
                size: new Vector2(20, 20),
                fontSize: 30,
                fontColor: 'white',
                textTransparency: 0.75
            });
            this.upArrow.parentTo(this);
            
            this.arrowLeft = new UIText('←', {
                positionScale: new Vector2(0.2, 0.5),
                pivot: new Vector2(0, 0.5),
                size: new Vector2(20, 20),
                fontSize: 30,
                fontColor: 'white',
                textTransparency: 0.75
            });
            this.arrowLeft.parentTo(this);
            
            this.arrowRight = new UIText('→', {
                positionScale: new Vector2(0.68, 0.5),
                pivot: new Vector2(0, 0.5),
                size: new Vector2(20, 20),
                fontSize: 30,
                fontColor: 'white',
                textTransparency: 0.75
            });
            this.arrowRight.parentTo(this);

            this.active = true;
            this.radius = 65 * scale;

            this.homePositionAbsolute = positionAbsolute;
            this.homePositionScale = positionScale;

            this.grabbed = new Event();
            this.dragged = new Event();
            this.released = new Event();
            
            this.grabPosition = Vector2.zero;
            this.mouseHandler = this.onJoystickDragged.bind(this);

            this.mouseDown.listen((grabPosition, mouse) => {
                this.grabPosition = grabPosition;

                this.onJoystickGrabbed(grabPosition);
                mouse.mouseMoved.listen(this.mouseHandler);

                mouse.mouseUp.listen((upPosition) => {
                    this.grabPosition = Vector2.zero;
                    
                    mouse.mouseMoved.unlisten(this.mouseHandler);
                    this.onJoystickReleased(upPosition);
                });
            });
        }

        renderObject (context, screenSize) {
            const size = this.getScreenSize(screenSize);
            const position = this.getScreenPosition(screenSize);

            context.fillStyle = '#ffffff';
            context.globalAlpha = 0.5;

            context.beginPath();
            context.arc(size.x / 2, size.y / 2, this.radius, 0, Math.PI * 2);
            context.fill();

            context.lineWidth = 10
            context.fillStyle = '#ffffff';
            context.stroke();
            
            super.renderObject(context, screenSize);
        }

        onJoystickGrabbed (position) {
            this.grabbed.trigger(position);
            console.log('grabbed: ', position);
            this.positionAbsolute = position;
        }
        
        onJoystickDragged (position) {
            console.log('dragged: ', position);
            this.positionAbsolute = position;
        }

        onJoystickReleased (position) {
            this.released.trigger(position);

            this.positionAbsolute = this.homePositionAbsolute;
            this.positionScale = this.homePositionScale;
        }
    };
})();