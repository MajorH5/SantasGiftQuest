import { Vector2 } from "../PhysicsJS2D/src/vector2.js";

export const AIDebugger = (function () {
    return class AIDebugger {
        constructor (host) {
            this.host = host;
            this.primaryState = '<none>';
            this.secondaryStates = [];
            this.rays = [];
        }

        render (context, offset, scale) {
            const body = this.host.body;

            const position = body.position;
            const size = body.size;

            context.textAlign = 'center';
            context.font = '16px monospace';
            context.fillStyle = 'white';

            const screenPosition = new Vector2(
                position.x * scale + offset.x * scale,
                position.y * scale + offset.y * scale
            );
            const screenSize = new Vector2(
                size.x * scale,
                size.y * scale
            );

            context.fillText(this.primaryState, screenPosition.x + screenSize.x / 2, screenPosition.y - screenSize.y / 2 - 16);

            context.textAlign = 'left';

            for (let i = 0; i < this.secondaryStates.length; i++) {
                const state = this.secondaryStates[i];
                context.fillText(state,
                    screenPosition.x + screenSize.x + 60,
                    screenPosition.y - screenSize.y / 2 + 16 * (i + 1));
            }

            for (let i = 0; i < this.rays.length; i++) {
                const { ray, result } = this.rays[i];

                const world = this.host.world;
                world.debug.drawRay(ray, offset, scale);

                if (result.hit !== null) {
                    const body = result.hit;

                    context.fillStyle = 'red';
                    context.globalAlpha = 0.5;
                    context.fillRect(
                        body.position.x * scale + offset.x * scale,
                        body.position.y * scale + offset.y * scale,
                        body.size.x * scale,
                        body.size.y * scale
                    );
                }
            }

            context.globalAlpha = 1;
        }

        highlightTile () {

        }
 
        setPrimaryState (state) {
            this.primaryState = `<${state}>`;
        }

        addState (stateInformation) {
            this.secondaryStates.push(`[${stateInformation}]`);
        }

        addRay (ray, result) {
            this.rays.push({ ray, result });
        }

        reset () {
            // clears out all temp states that are stored
            // for the current frame
            this.clearSecondaryStates();
            this.clearRays();
        }

        clearSecondaryStates () {
            this.secondaryStates = [];
        }

        clearRays () {
            this.rays = [];
        }
    }
})();