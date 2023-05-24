import { SantasGiftQuest } from "./lib/santasgiftquest.js";

const canvas = document.getElementById("canvas");
const game = new SantasGiftQuest(canvas);

(async function () {
    await game.init();
    game.globalStart();
    globalThis.game = game;
})();