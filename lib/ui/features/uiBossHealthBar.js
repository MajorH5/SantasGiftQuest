import { Vector2 } from '../../PhysicsJS2D/src/vector2.js';
import { UIBase } from '../uiBase.js';
import { UIText } from '../uiText.js';

export const UIBossHealthBar = (function () {
    return class UIBossHealthBar extends UIBase {
        // creates a new boss health bar object
        constructor (bossName, color) {
            super({
                pivot: new Vector2(0.5, 0),
                positionScale: new Vector2(0.5, -0.1),
                size: new Vector2(500, 100)
            });

            this.text = new UIText(bossName, {
                fontSize: 30,
                fontColor: 'white',
                shadow: true,
                shadowOffset: new Vector2(0, 4),
                shadowColor: color,

                pivot: new Vector2(0.5, 1),
                position: new Vector2(0, -15),
                positionScale: new Vector2(0.5, 0)
            });

            this.bar = new UIBase({
                size: new Vector2(700, 30),
                pivot: new Vector2(0.5, 0),
                positionScale: new Vector2(0.5, 0),
                position: new Vector2(0, 15),
                backgroundEnabled: true,
                backgroundColor: 'white',
            });

            this.progress = new UIBase({
                sizeScale: new Vector2(1, 1),
                backgroundEnabled: true,
                backgroundColor: color
            });

            this.progress.parentTo(this.bar);

            this.bar.parentTo(this);
            this.text.parentTo(this);

            this.posScaleGoal = this.positionScale;
            this.sizeScaleGoal = this.sizeScale;
            
            this.posMoveStart = 0;
            this.sizeMoveStart = 0;

            this.lerpTime = 150;
        }
        
        // updates the health bar
        update (deltaTime) {
            super.update(deltaTime);
            this.updatePositionTween(deltaTime);
            this.updateSizeTween(deltaTime);
        }

        // sets the position goal of the health bar
        setPositionGoal (goal) {
            this.posScaleGoal = goal;
            this.posMoveStart = Date.now();
        }

        // sets the size goal of the health bar
        setSizeGoal (goal) {
            this.sizeScaleGoal = goal;
            this.sizeMoveStart = Date.now();
        }

        // updates the current positioning tween
        updatePositionTween (deltaTime) {
            if (this.posMoveStart > 0) {
                const elapsed = (Date.now() - this.posMoveStart) / 1000;
                const progress = Math.min(elapsed / this.lerpTime, 1);
                const delta = this.posScaleGoal.subtract(this.positionScale);

                this.positionScale = this.positionScale.add(delta.scale(progress));

                if (progress === 1) {
                    this.posMoveStart = 0;
                }
            }
        }

        // updates the current sizing tween
        updateSizeTween (deltaTime) {
            if (this.sizeMoveStart > 0) {
                const elapsed = (Date.now() - this.sizeMoveStart) / 1000;
                const progress = Math.min(elapsed / this.lerpTime, 1);
                const delta = this.sizeScaleGoal.subtract(this.progress.sizeScale);

                this.progress.sizeScale = this.progress.sizeScale.add(delta.scale(progress));

                if (progress === 1) {
                    this.sizeMoveStart = 0;
                }
            }
        }
        // sets the progress of the health bar
        // should be a value between 0 and 1
        setProgress (progress) {
            this.sizeMoveStart = 0; // stops any current sizing tweens
            this.progress.sizeScale = new Vector2(progress, 1);
        }
    };
})();