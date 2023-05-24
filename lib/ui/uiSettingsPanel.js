import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { NineSliceImage } from "./nineSliceImage.js";
import { Sprite } from "../sprite.js";
import { UIToggle } from "./uiToggle.js";
import { UIBase } from "./uiBase.js";
import { UIText } from "./uiText.js";
import { Settings } from "../settings.js";

export const UISettingsPanel = (function () {
    return class UISettingsPanel extends UIBase {
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                visible: false
            });

            this.headerText = new UIText("SETTINGS", {
                positionScale: new Vector2(0.5, 0.2),
                pivot: new Vector2(0.5, 0),
                fontColor: "#eeeeee",
                shadow: true,
                shadowOffset: new Vector2(0, 4),
                fontSize: 30,
            });

            this.panelImage = new NineSliceImage(Sprite.IMG_PANEL, {
                positionScale: new Vector2(0.5, 0.1),
                position: new Vector2(-65*7/2, 0),
                size: new Vector2(65, 80),
                imageScale: 7
            });

            this.options = 0;

            this.panelImage.parentTo(this);
            this.headerText.parentTo(this);

            this.createSettingsOption('Global particles', Settings.GlobalParticlesEnabled, (state) => {
                Settings.GlobalParticlesEnabled = state;
            });
            this.createSettingsOption('Camera shake', Settings.CameraShakeEnabled, (state) => {
                Settings.CameraShakeEnabled = state;
            });
            // this.createSettingsOption('Debug mode', false, (state) => {
            //     Settings.DebugModeEnabled = state;
            // });
        }

        // creates a new settings option
        createSettingsOption (optionName, defaultValue, onToggle) {
            const optionHeight = 16 * 3;
            const optionPadding = 0
            const offset = new Vector2(20, optionHeight * this.options + optionPadding * this.options);

            const optionText = new UIText(optionName, {
                positionScale: new Vector2(0.5, 0.25),
                position: offset,
                sizeScale: new Vector2(0, 0),
                size: new Vector2(65*7, optionHeight),
                pivot: new Vector2(0.5, 0),

                fontSize: 13,
                fontColor: '#4e4c6b',
                // font: 'Arial',
                textXAlignment: 'left'
            });
            
            const optionToggle = new UIToggle(defaultValue, {
                pivot: new Vector2(1, 0.5),
                positionScale: new Vector2(1, 0.5),
                size: new Vector2(16, 16).scale(3),
                position: new Vector2(-60, 0)
            });

            optionToggle.onToggle.listen((state) => onToggle(state));

            optionText.parentTo(this);
            optionToggle.parentTo(optionText);

            this.options++;
        }
    }
})();