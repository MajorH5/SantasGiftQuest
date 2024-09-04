import { Vector2 } from "../PhysicsJS2D/src/vector2.js";

export const Particle = (function () {
    return class Particle {
        // creates a new particle at the specified position
        constructor (properties) {
            this.properties = properties;

            const velocityOffset = new Vector2(
                properties.velocityVariation.x * (Math.random() - 0.5),
                properties.velocityVariation.y * (Math.random() - 0.5),
            );

            this.lifetime = 0;

            this.opacity = properties.opacity.start;
            this.size = properties.size.start;
            this.color = properties.confetti ? this.hexRandomColor() : properties.color.start;
            this.rotation = properties.rotation.start;
            this.position = properties.position;
            this.velocity = properties.velocity.add(velocityOffset);
        }

        // steps the progression of the particle
        update (deltaTime) {
            this.lifetime += deltaTime;

            if (this.isDead()) {
                return;
            }

            const alpha = this.getAlpha();
            const properties = this.properties;
            
            const rotation = this.lerp(properties.rotation.start,
                properties.rotation.finish, alpha);
            const size = this.lerp(properties.size.start,
                properties.size.finish, alpha);
            const color = this.lerp(properties.color.start,
                properties.color.finish, alpha);
            const opacity = this.lerp(properties.opacity.start,
                properties.opacity.finish, alpha);

            this.position = this.position.add(this.velocity);
            this.velocity = this.velocity.add(new Vector2(0, properties.gravity));
            
            this.rotation = rotation;
            this.size = size;
            this.opacity = opacity;
            
            if (!properties.confetti) {
                // confetti ignores color changes
                this.color = color;
            }
        }

        // renders the particle
        render (context, offset, scale) {
            if (this.isDead()) {
                return;
            }

            const renderSize = this.size.scale(scale);
            const renderPosition = renderSize.scale(-0.5);
            const translation = new Vector2(
                (this.position.x * scale + offset.x * scale) + renderSize.x,
                (this.position.y * scale + offset.y * scale) + renderSize.y,
            );
            
            if (this.properties.sprite) {
                this.properties.sprite.setSize(this.size);
                this.properties.sprite.setTransparency(this.opacity);
                this.properties.sprite.setRotation(this.rotation);
                this.properties.sprite.setPosition(this.position);
                this.properties.sprite.render(context, offset, scale);
            } else {
                context.globalAlpha = this.opacity;
                context.fillStyle = this.color;
                context.save();
                context.translate(translation.x, translation.y);
                context.rotate(this.rotation);
                context.fillRect(
                    renderPosition.x,
                    renderPosition.y,
                    renderSize.x,
                    renderSize.y,
                    );
                context.restore();
            }

            context.globalAlpha = 1;
        }

        // returns true if the particle
        // is visible on the screen
        isVisible (context, offset, scale) {
        }

        // returns true if the particle
        // has expended its lifetime
        isDead () {
            return this.lifetime >= this.properties.lifetime;
        }

        // returns the time remaining for the particle
        // as a value between 0 and 1
        getAlpha () {
            return this.lifetime / this.properties.lifetime;
        }

        // linearly interpolates between two values
        lerp (start, finish, time) {
            if (typeof start === 'number') {
                return start + (finish - start) * time;
            } else if (typeof start === 'object') {
                return start.add(finish.subtract(start).scale(time));
            } else if (typeof start === 'string') {
                const startColor = this.hexToRgb(start);
                const finishColor = this.hexToRgb(finish);

                const color = {
                    r: this.lerp(startColor.r, finishColor.r, time) | 0,
                    g: this.lerp(startColor.g, finishColor.g, time) | 0,
                    b: this.lerp(startColor.b, finishColor.b, time) | 0,
                }

                return this.rgbToHex(color);
            } else {
                console.warn("Unknown type for lerp: " + start)
            }
        }

        // returns a random hex color
        hexRandomColor () {
            return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
        }

        // converts a hex color to rgb
        hexToRgb (hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        // converts an rgb color to hex
        rgbToHex (rgb) {
            return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
        }
    }
})();