import { Sounds } from "/lib/sounds/sounds.js";

export const Levels = (function () {
    // class for managing level data
    return class Levels {
        static MIN_LEVEL = 1;
        static MAX_LEVEL = 11;

        static LEVEL_PREFIX = '/assets/maps/level';
        static SIGN_DATA_PATH = '/assets/misc/sign_text.json';
        static DEFAULT_SIGN_TEXT = 'This sign is missing content!'

        static LEVEL_DATA_CACGE = {};

        static SIGN_DATA = null;

        static lastRandomLevel = null;
        
        // preloads all the level data
        // into memory
        static async preloadAll () {
            const promises = [];

            for (let levelNum = Levels.MIN_LEVEL; levelNum <= Levels.MAX_LEVEL; levelNum++) {
                promises.push(Levels.load(levelNum));
            }

            promises.push(Levels.loadSignData());
            
            await Promise.all(promises);
        }

        // loads a level from the given level number
        static async load (levelNumber) {
            const levelPath = Levels.LEVEL_PREFIX + `${levelNumber}.json`;
            const levelData = await fetch(levelPath).then(response => response.json()).catch(error => {
                console.error(`Error loading level\n\t${levelNumber}: ${error}`);
            });

            if (!levelData) {
                return null;
            }

            Levels.storeLevelData(levelNumber, levelData);

            return levelData;
        }

        // loads the sign data for the levels
        static async loadSignData () {
            fetch(Levels.SIGN_DATA_PATH).then(async (response) => {
                const json = await response.json();

                Levels.SIGN_DATA = json;
            }).catch(error => {
                console.error(`Failed to load sign data:\n\t${error}`);
            });   
        }

        // returns the sign text for the given
        // stage number and tile position
        static getSignText (stageNumber, tilePosition) {
            const levelName = Levels.getLevelName(stageNumber);
            const stageSigns = Levels.SIGN_DATA !== null && Levels.SIGN_DATA[levelName];

            if (!stageSigns) {
                console.warn(`Sign data was not found for ${stageNumber} - (${tilePosition.x}, ${tilePosition.y})!`);
                return Levels.DEFAULT_SIGN_TEXT;
            }

            const signLookupIndex = `${tilePosition.x}-${tilePosition.y}`;
            const signTextData = stageSigns[signLookupIndex];

            if (signTextData) {
                return signTextData;
            }

            return Levels.DEFAULT_SIGN_TEXT;
        }

        // stores the given level data
        // in the cache
        static storeLevelData (levelNumber, levelData) {
            Levels.LEVEL_DATA_CACGE[levelNumber] = levelData;
        }

        // deletes the given level data
        // from the cache
        static deleteLevelData (levelNumber) {
            delete Levels.LEVEL_DATA_CACGE[levelNumber];
        }

        // returns the level data for the
        // given level number
        static async getLevelData (levelNumber) {
            const cached = Levels.LEVEL_DATA_CACGE[levelNumber];

            if (cached) {
                return cached
            }

            return await Levels.load(levelNumber);
        }

        // returns the formatted name of the given level
        static getLevelName (levelNumber) {
            return `level${levelNumber}`;
        }

        // returns the stinger that should play
        // for the given level
        static getStinger (levelNumber) {
            if (Levels.isBossStage(levelNumber)) {
                // boss plays its own stinger on death
                return null;
            }

            if (Levels.isDayStage(levelNumber)) {
                return Sounds.SND_THEME_STINGER;
            }

            if (Levels.isNightStage(levelNumber)) {
                return Sounds.SND_NIGHT_THEME_STINGER;
            }

            if (Levels.isWorkshopStage(levelNumber)){
                return Sounds.SND_WORKSHOP_THEME_STINGER;
            }

            return null;
        }

        // returns the theme that should play
        // for the given level
        static getTheme (levelNumber) {
            if (Levels.isBossStage(levelNumber)) {
                // boss will always play the boss theme for itself
                return null;
            }

            if (Levels.isDayStage(levelNumber)) {
                return Sounds.SND_THEME;
            }

            if (Levels.isNightStage(levelNumber)) {
                return Sounds.SND_NIGHT_THEME;
            }

            if (Levels.isWorkshopStage(levelNumber)){
                return Sounds.SND_WORKSHOP_THEME;
            }

            return null;
        }

        // returns true if the given level
        // is a day stage
        static isDayStage (levelNumber) {
            return levelNumber < 5;
        }

        // returns true if the given level
        // is a night stage
        static isNightStage (levelNumber) {
            return levelNumber >= 5 && levelNumber <= 10;
        }

        // returns true if the given level
        // is a workshop stage
        static isWorkshopStage (levelNumber) {
            return levelNumber >= 11 && levelNumber <= 15;
        }

        // returns true if the given level
        // is a boss stage
        static isBossStage (levelNumber) {
            return levelNumber % 5 === 0;
        }

        // returns a random level number
        static getRandomLevelNumber (avoidRepeat) {
            let levelNumber = Math.floor(Math.random() * (Levels.MAX_LEVEL - Levels.MIN_LEVEL) + Levels.MIN_LEVEL);

            if (avoidRepeat && Levels.MIN_LEVEL !== Levels.MAX_LEVEL) {
                // avoid repeating the same level
                if (levelNumber === Levels.lastRandomLevel) {
                    levelNumber = Levels.getRandomLevelNumber(true);
                }
            }

            Levels.lastRandomLevel = levelNumber;

            return levelNumber;
        }
    }
})();