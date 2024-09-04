import { SantasGiftQuest } from "./lib/santasGiftQuest.js";
import { Constants } from "./lib/misc/constants.js";

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const game = new SantasGiftQuest(canvas);

function waitUserInteraction () {
    return new Promise((resolve) => {
        document.addEventListener('mousedown', resolve, { once: true });
        document.addEventListener('touchstart', resolve, { once: true});
        document.addEventListener('keydown', resolve, { once: true});
    });
}

function drawText (text, x = canvas.width / 2, y = canvas.height / 2) {
    context.font = '20px sans-serif';
    context.fillStyle = 'white';
    context.textAlign = 'center';

    context.fillText(text, x, y);
}

(async function () {
    if (!Constants.DEV_ENVIRONMENT) {
        canvas.width = SantasGiftQuest.DEFAULT_CANVAS_SIZE.x;
        canvas.height = SantasGiftQuest.DEFAULT_CANVAS_SIZE.y;

        drawText('Preloading content, please wait. This wont take long.');
    }
    
    await game.init();
    
    if (!Constants.DEV_ENVIRONMENT) {
        drawText('Click to start the game.');
        await waitUserInteraction();
    }

    game.globalStart();
    globalThis.game = game;
})();