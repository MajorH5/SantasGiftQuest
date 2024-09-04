import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { UIBase } from "../uiBase.js";
import { UIText } from "../uiText.js";

export const UICreditsScreen = (function () {
    return class UICreditsScreen extends UIBase {
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#041d28",
                transparency: 0.75,
                backgroundEnabled: true,
                visible: false
            });

            const creditsText = `
Thank you for playing!

All sprite assets and sound effects were created by me unless otherwise noted.

Music:
•   Jolly Adventure (a) APM MUSIC (DED-0171)
•   Retro Gamer (a) APM MUSIC (DED-0171)
•   Battle Hero (a) APM MUSIC (DED-0171)
•   Battle Hero (sting) APM MUSIC (DED-0171)
•   Race Track (a) APM MUSIC (DED-0171)
•   Race Track (sting) APM MUSIC (DED-0171)
•   Bossa Me (a) APM MUSIC (DED-0171)
Font:
•   Press Start 2P by CodeMan38 (OFL License)

The music used in this game was acquired
from APM Music (DED-0171) and is not my original work.
All music rights and ownership belong to their respective owners.
The use of this music in the game is strictly for
entertainment purposes only and not for any commercial gain.

Made with vanilla JavaScript, HTML, and CSS with no external libraries.

Created by: Habib Aina
`;

            this.creditsText = new UIText(creditsText, {
                backgroundColor: 'red',
                transparency: 0.5,
                sizeScale: new Vector2(0.7, 0.5),
                positionScale: new Vector2(0.5, 1),
                pivot: new Vector2(0.5, 0),
                fontColor: 'white',
                fontSize: 10,
                textYAlignment: 'top',
            });

            this.creditsText.parentTo(this);
            
        }

        // updates the UI credits object
        update (deltaTime) {
            super.update(deltaTime);
            this.handleScrolling(deltaTime);
        }

        // handles the credits scrolling
        handleScrolling (deltaTime) {
            const scrollSpeed = 3;
            
            if (this.creditsText.positionAbsolute.y > -600) {
                this.creditsText.positionAbsolute.y -= scrollSpeed;   
            }
        }
    }
})();