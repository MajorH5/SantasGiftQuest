import { SantasGiftQuest } from "./lib/santasGiftQuest.js";

const canvas = document.getElementById("canvas");
const game = new SantasGiftQuest(canvas);

(async function () {
    await game.init();
    game.globalStart();
    globalThis.game = game;
})();