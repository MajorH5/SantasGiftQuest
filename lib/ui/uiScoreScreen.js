import { ParticlesManager } from '../particlesManager.js';
import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Event } from '../PhysicsJS2D/src/event.js';
import { UISleigh } from './uiSleigh.js';
import { UIBase } from './uiBase.js';
import { UIText } from './uiText.js';
import { Sounds } from '../sounds.js';
import { Settings } from '../settings.js';

export const UIScoreScreen = (function () {
    return class UIScoreScreen extends UIBase {
        // creates a new score screen object
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundEnabled: true,
                backgroundColor: '#163A4B',
                visible: false
            });

            // Header stuff:

            // pivot location for header text
            this.headerPivot = new UIBase({
                size: new Vector2(50, 50),
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.15)
            });
            this.headerPivot.parentTo(this);


            // top text of score screen
            this.headerText = new UIText('CHRISTMAS IS SAVED', {
                fontSize: 35,
                fontColor: 'white',

                shadow: true,
                shadowOffset: new Vector2(-3, 0),
                shadowBlur: 0,

                sizeScale: new Vector2(1, 1),
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.5),
            });
            this.headerText.parentTo(this.headerPivot);

            // give a bit more volume to the header text object
            this.headerTextClone = this.headerText.clone();
            this.headerTextClone.positionAbsolute = new Vector2(-4, 0);
            // this.headerTextClone.fontColor = 'red';
            this.headerTextClone.parentTo(this.headerText);

            this.headerFluctuation = 0.04; // how much header rotates by (radians)
            this.headerRotateSpeed = 0.002; // speed header rotates

            // Score stuff:
            // main body cotainer of score frames
            this.scoreContainer = new UIBase({
                size: new Vector2(800, 350),
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.5),

                backgroundEnabled: true,
                backgroundColor: '#132D38'
            });
            this.scoreContainer.parentTo(this);

            this.finalScoreContainer = new UIBase({
                backgroundEnabled: true,
                backgroundColor: '#132D38',

                size: new Vector2(460, 80),
                positionScale: new Vector2(0.5, 1),
                pivot: new Vector2(0.5, 1),
                position: new Vector2(0, -90)
            });
            this.finalScoreContainer.parentTo(this);

            this.finalScorePrefix = new UIText(' FINAL SCORE:', {
                fontSize: 20,
                fontColor: 'white',
                textXAlignment: 'left',

                sizeScale: new Vector2(1, 1),
            });
            this.finalScorePrefix.parentTo(this.finalScoreContainer);

            this.finalScoreText = new UIText('0', {
                fontSize: 20,
                fontColor: 'white',
                textXAlignment: 'right',

                shadow: true,
                shadowOffset: new Vector2(0, 2),
                shadowColor: '#9593CA',
                shadowBlur: 0,

                position: new Vector2(-10, 0),
                sizeScale: new Vector2(1, 1)
            });
            this.finalScoreText.parentTo(this.finalScoreContainer);

            this.exitButton = new UIText('MENU', {
                clickable: true,
                font: 30,
                fontColor: 'white',

                shadow: true,
                shadowOffset: new Vector2(0, 2),
                shadowColor: '#9593CA',
                shadowBlur: 0,

                backgroundEnabled: true,
                backgroundColor: '#132D38',

                borderSize: 3,
                borderColor: '#9593CA',
            
                pivot: new Vector2(0.5, 0),
                sizeScale: new Vector2(0.4, 0.75),
                positionScale: new Vector2(0.5, 1),
                position: new Vector2(0, 10)
            });
            this.exitButton.parentTo(this.finalScoreContainer);

            this.onMenu = new Event();

            this.exitButton.mouseUp.listen(() => this.onMenu.trigger());

            // Particle stuff:
            this.particlesManager = new ParticlesManager();

            const particleProperties = {
                confetti: true,
                gravity: 0.7,

                size: {
                    start: new Vector2(50, 50),
                    finish: new Vector2(25, 25)
                },

                opacity: {
                    start: 1,
                    finish: 0
                },

                velocity: new Vector2(15, -25),
                velocityVariation: new Vector2(15, 15)
            };

            this.bottomLeftEmitter = this.particlesManager.createEmitter(particleProperties);

            this.bottomRightEmitter = this.particlesManager.createEmitter(particleProperties);
            this.bottomRightEmitter.properties.velocity = new Vector2(-15, -25) // flip velocity to move towards center
            
            this.scoreFrames = [];
            this.sleighs = [];

            this.shakeTime = 0;
            this.shakeIntensity = 5;
            this.maxSleighs = 10;
        }

        // clears and resets the score screen
        reset () {
            this.onUpdate.clear();

            for (const frame of this.scoreFrames) {
                frame.unparent();
            }

            for (const sleigh of this.sleighs) {
                sleigh.unparent();
            }

            this.scoreFrames = [];
            this.sleighs = [];
            this.shakeTime = 0;

            this.particlesManager.clear();
            this.setScore(0);
        }

        // creates a new score frame object
        createScoreFrame (scoreName, bonus, score) {
            const container = new UIBase({
                sizeScale: new Vector2(1, 0),
                size: new Vector2(0, 50),
                positionScale: new Vector2(2, 0),
                position: new Vector2(0, this.scoreFrames.length * 50),
                borderSize: 3,
                borderColor: '#DA9B99'
            });

            const name = new UIText(scoreName, {
                fontColor: 'white',
                fontSize: 20,

                shadow: true,
                shadowBlur: 0,
                shadowOffset: new Vector2(0, 2.5),
                shadowColor: '#DA9B99',

                sizeScale: new Vector2(0, 1),
                size: new Vector2(20 * scoreName.length * 1.07, 0),
                
                pivot: new Vector2(0, 0.5),
                positionScale: new Vector2(0, 0.5)
            });

            const bonusContent = `(* ${bonus})`;
            const bonusText = new UIText(bonusContent, {
                fontColor: 'white',
                fontSize: 20,
                textTransparency: 0.5,

                sizeScale: new Vector2(0, 1),
                size: new Vector2(20 * bonusContent.length * 1.07, 0),
                pivot: new Vector2(0, 0.5),
                positionScale: new Vector2(1, 0.5)
            });

            const scoreText = new UIText(this.formatNumber(score), {
                fontColor: 'white',
                fontSize: 20,
                textXAlignment: 'left',

                shadow: true,
                shadowBlur: 0,
                shadowOffset: new Vector2(0, 3),
                shadowColor: '#DA9B99',

                sizeScale: new Vector2(0, 1),
                
                pivot: new Vector2(0, 0.5),
                positionScale: new Vector2(1, 0.5)
            });

            name.parentTo(container);
            bonusText.parentTo(name);
            scoreText.parentTo(bonusText);

            this.scoreFrames.push(container);
            container.parentTo(this.scoreContainer);

            if (container.positionAbsolute.y + 50 > this.scoreContainer.sizeAbsolute.y) {
                const first = this.scoreFrames.shift();
                first.unparent();
                this.scoreFrames.forEach((frame) => {
                    frame.positionAbsolute.y -= 50;
                });
            }

            this.animateNumber(scoreText, 0, bonus * score, 3000);

            return container;
        }

        // runs a brief physics simulation on the score frame
        async slideDownFrame (frame) {
            let impactedOnce = false;
            let velocity = 0;
            let position = 0;
            let gravity = -2;
            let positionMax = -frame.parent.sizeAbsolute.x * frame.positionScale.x;

            return new Promise((resolve) => {
                const onUpdate = (dt) => {
                    velocity += gravity;
                    position += velocity;
    
                    if (position <= positionMax) {
                        velocity *= -0.35;

                        if (!impactedOnce) {
                            impactedOnce = true;
                            Sounds.playSfx(Sounds.SND_SCORE_IMPACT, Sounds.SFX_DEFAULT_VOLUME * 1.5);
                            this.shake(1);
                            this.bottomLeftEmitter.emit(30);
                            this.bottomRightEmitter.emit(30);
                        } else {
                            Sounds.playSfx(Sounds.SND_SCORE_IMPACT, Sounds.SFX_DEFAULT_VOLUME * (velocity / 5));
                        }
                        
                        if (Math.abs(velocity) < 1) {
                            resolve();
                            this.onUpdate.unlisten(onUpdate);
                        }

                        position = positionMax;
                    }

                    frame.positionAbsolute = new Vector2(position, frame.positionAbsolute.y);
                };
    
                this.onUpdate.listen(onUpdate);
            })
        }

        // plays the sliding frame score animations
        async playScoreAnimations (scoreObject) {
            const scores = scoreObject.getScoreList();
            const finalScore = scoreObject.getScore();

            this.animateNumber(this.finalScoreText, 0, finalScore, 2000 * scores.length);

            for (const [scoreName, bonusPts, scoreValue] of scores) {
                const frame = this.createScoreFrame(scoreName.toUpperCase(), bonusPts, scoreValue);
                await this.slideDownFrame(frame);
            }
        }

        // plays a number increasing animation on the given uitext
        async animateNumber (text, start, end, duration) {
            let time = 0;
            let value = start;

            return new Promise((resolve) => {
                const onUpdate = (dt) => {
                    time += dt;
                    value = Math.min(start + (end - start) * (time / duration), end);
                    text.text = this.formatNumber(Math.floor(value));

                    if (time >= duration) {
                        resolve();
                        this.onUpdate.unlisten(onUpdate);
                    }
                };

                this.onUpdate.listen(onUpdate);
            });
        }

        // formats the given number to a string with commas
        formatNumber (number) {
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // sets the current showing score of the score screen
        setScore (score) {
            this.finalScoreText.text = this.formatNumber(score);
        }

        // shakes the ui score screen object
        shake (duration) {
            if (!Settings.CameraShakeEnabled) {
                return;
            }

            this.shakeTime = duration * 1000;
        }

        // updates the score screen effects
        update (deltaTime) {
            super.update(deltaTime);
            this.particlesManager.update(deltaTime);
            this.headerPivot.rotation = Math.sin(Date.now() * this.headerRotateSpeed) * this.headerFluctuation;

            if (this.shakeTime > 0) {
                if (!Settings.CameraShakeEnabled) {
                    this.shakeTime = 0;
                } else {
                    this.shakeTime -= deltaTime;
                }

                if (this.shakeTime < 0) {
                    this.shakeTime = 0;
                }
            }
            
            if (Sounds.currentTheme !== Sounds.SND_TITLE_THEME) {
                Sounds.playTheme(Sounds.SND_TITLE_THEME, Sounds.MUSIC_DEFAULT_VOLUME, 1, true, 6);
            }

            this.sleighs.forEach(sleigh => {
                if (sleigh.isDead) {
                    this.sleighs.splice(this.sleighs.indexOf(sleigh), 1);
                }
            });

            while (this.sleighs.length < this.maxSleighs) {
                const sleigh = new UISleigh(0.15 + Math.random() * 0.85);
                sleigh.parentTo(this);
                this.sleighs.push(sleigh);
            }
        }

        // renders the score screen effects
        render (context, screenSize) {
            const shake = new Vector2(Math.random(), Math.random()).scale(this.shakeIntensity);

            shake.x *= Math.random() < .5 ? -1 : 1;
            shake.y *= Math.random() < .5 ? -1 : 1;

            if (this.shakeTime > 0) {
                context.translate(shake.x, shake.y);
            }

            super.render(context, screenSize);

            this.particlesManager.render(context, Vector2.zero, 1);

            this.bottomLeftEmitter.properties.position = new Vector2(-50, screenSize.y);
            this.bottomRightEmitter.properties.position = new Vector2(screenSize.x, screenSize.y);

            if (this.shakeTime > 0) {
                context.translate(-shake.x, -shake.y);
            }
        }
    }
})();