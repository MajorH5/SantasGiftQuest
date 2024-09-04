import { Vector2 } from '../PhysicsJS2D/src/vector2.js';
import { Settings } from '../misc/settings.js';

export const Camera = (function () {
    return class Camera {
        static DEFAULT_SCALE = 1;

        constructor (world, worldSize, scale) {
            this.world = world;
            this.worldSize = worldSize;
            this.scale = scale;
            this.position = new Vector2(0, 0);
            this.smoothFollow = true;
            this.smoothFollowSpeed = 0.1;

            this.currentShake = new Vector2(0, 0);
            this.shakeDuration = 0;
            this.shakeIntensity = 0;
            this.isShaking = false;

            this.tracking = null;
            this.targetPoint = null;
            this.subject = null;
        }

        // resets the camera back to its default state
        reset () {
            this.position = new Vector2(0, 0);
            this.currentShake = new Vector2(0, 0);
            this.tracking = null;
            this.targetPoint = null;
            this.subject = null;
            this.shakeDuration = 0;
            this.shakeIntensity = 0;
            this.isShaking = false;
            this.scale = Camera.DEFAULT_SCALE;
            this.smoothFollow = true;
            this.smoothFollowSpeed = 0.1;
        }

        // sets a position to look at instead of a body
        target (point) {
            this.targetPoint = point;
            this.tracking = null;
            this.subject = null
        }

        // sets the body of the entity
        // to be tracked by the camera
        track (entity) {
            this.tracking = entity.body;
            this.subject = entity;
            this.targetPoint = null;

            // TODO: center immediately
        }

        // causes the camera to shake
        shake (intensity, duration) {
            if (!Settings.CameraShakeEnabled) {
                return;
            }

            this.shakeDuration += duration * 1000;
            this.shakeIntensity += intensity;
            this.isShaking = true;
        }

        // stops the camera from shaking
        stopShake () {
            this.shakeDuration = 0;
            this.shakeIntensity = 0;
            this.isShaking = false;
        }

        // updates the camera shake
        updateShake (deltaTime) {
            if (!this.isShaking) {
                return;
            }

            if (!Settings.CameraShakeEnabled) {
                this.stopShake();
                return;
            }
            
            const random = new Vector2(Math.random() - 0.5,
                Math.random() - 0.5).scale(2);

            this.currentShake = new Vector2(
                random.x * this.shakeIntensity,
                random.y * this.shakeIntensity
            );

            this.shakeDuration -= deltaTime;

            if (this.shakeDuration <= 0) {
                this.stopShake();
            }
        }

        lerpVector (v1, v2, time) {
            return v1.add(v2.subtract(v1).scale(time)); 
        }   

        update (deltaTime) {
            if (this.tracking === null && this.targetPoint === null){
                return;
            }

            const trackingPosition = this.tracking ? this.tracking.getCenter() : this.targetPoint;

            const centerOffset = this.getCenterOffset();
            const cameraFinalGoal = trackingPosition.add(centerOffset);

            if (this.smoothFollow) {
                const current = this.lerpVector(this.position, cameraFinalGoal, this.smoothFollowSpeed);
            
                this.lookAt(current, false);
            } else {
                this.lookAt(cameraFinalGoal, false)
            }

            this.updateShake(deltaTime);
        }

        lookAt (position, applyCenterOffset = true) {
            if (applyCenterOffset) {
                position = position.add(this.getCenterOffset());
            }

            this.position = position;
        }

        // returns the negative offset from the center of the screen
        getCenterOffset () {
            const renderRegion = this.world.renderRegion;
            
            const renderOffset = this.world.renderPosition.scale(-1);
            const centerOffset = new Vector2(-renderRegion.x / 2 / this.scale, -renderRegion.y / 2 / this.scale);

            return centerOffset.add(renderOffset);
        }

        // sets the current scale of the camera
        setScale (scale) {
            this.scale = scale;
        }

        // returns the negative position of the camera
        // to be used as an offset
        getOffset () {
            return this.position.scale(-1).add(this.currentShake);
        }

        // returns the current scale of the camera
        getScale () {
            return this.scale;
        }
    }
})();