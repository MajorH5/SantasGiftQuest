export const Score = (function () {
    return class Score {
        // names and bonus values for each score type
        static VALUES = {
            enemiesDestroyed: 500,
            presentsCollected: 1000,
            timeBonus: 1,
            sleighReaches: 1500,
            grinchFinalBlow: 9999,
            snowmanFinalBlow: 10000,
            treesCollected: 1000,
            survivalBonus: 1000,
            snowMelted: 10
        };

        static DISPLAY_NAMES = {
            enemiesDestroyed: 'Enemies Destroyed',
            presentsCollected: 'Presents Collected',
            timeBonus: 'Time Bonus',
            sleighReaches: 'Sleigh Reaches',
            grinchFinalBlow: 'Grinch Final Blow',
            snowmanFinalBlow: 'Snowman Final Blow',
            treesCollected: 'Trees Collected',
            survivalBonus: 'Survival Bonus',
            snowMelted: 'Snow Melted'
        }

        // class for keeping track of score in a session
        constructor () {
            this.values = {};

            for (const key in Score.VALUES) {
                this.values[key] = 0;
            }
        }

        // increments the given score value by the given amount or 1
        increment (key, amount = 1) {
            if (this.values[key] === undefined) {
                throw new Error(`Score.increment(): Invalid score key: ${key}`);
            }

            this.values[key] += amount;
        }

        // decrements the given score value by the given amount or 1
        decrement (key, amount = 1) {
            if (this.values[key] === undefined) {
                throw new Error(`Score.decrement(): Invalid score key: ${key}`);
            }

            this.values[key] -= amount;
        }

        // sets the given score value to the given amount
        set (key, amount) {
            if (this.values[key] === undefined) {
                throw new Error(`Score.set(): Invalid score key: ${key}`);
            }

            this.values[key] = amount;
        }

        // returns the value of the given score key
        get (key) {
            if (this.values[key] === undefined) {
                throw new Error(`Score.get(): Invalid score key: ${key}`);
            }

            return this.values[key];
        }

        // returns a array formmated list of scores with display names
        getScoreList () {
            const scoreList = [];

            for (const key in this.values) {
                const name = Score.DISPLAY_NAMES[key];
                const bonus = Score.VALUES[key];
                const value = this.values[key];

                scoreList.push([name, bonus, value]);
            }

            return scoreList;
        }

        // returns the current score
        getScore () {
            let score = 0;

            for (const key in this.values) {
                score += this.values[key] * Score.VALUES[key];
            }

            return score;
        }

        // debug testing function, maxes out all scores
        maxOut () {
            for (const key in this.values) {
                this.values[key] = 69;
            }
        }

        // determines the player a score bonus based on the time remaining
        // in the level
        static determineTimeBonus (elapsedTimeSeconds) {
            // avg run takes about 8-10 min with 12 lvls
            const maxScore = 15000;
            const scoreDropStart = 100; // score starts falling
            
            if (elapsedTimeSeconds <= scoreDropStart) {
                return maxScore
            }
            
            const finalScore = -(1 / 25) * (elapsedTimeSeconds - scoreDropStart) ** 2 + maxScore
            
            return Math.floor(finalScore < 0 ? 0 : finalScore);
        }
    }
})();