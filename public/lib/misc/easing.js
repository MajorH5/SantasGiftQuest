export const Easing = (function () {
    return class Easing {
        static EasingType = {
          LINEAR: "linear",
          CUBIC: "cubic",
          EXPONENTIAL: "exponential"
        };
      
        static EasingDirection = {
          IN: "in",
          OUT: "out",
          IN_OUT: "inOut"
        };
      
        constructor(easingType, easingDirection) {
          this.easingType = easingType || Easing.EasingType.LINEAR;
          this.easingDirection = easingDirection || Easing.EasingDirection.IN;
        }
      
        getValue(t) {
          switch (this.easingType) {
            case Easing.EasingType.LINEAR:
              return this.linear(t);
            case Easing.EasingType.CUBIC:
              return this.cubic(t);
            case Easing.EasingType.EXPONENTIAL:
              return this.exponential(t);
            default:
              return t;
          }
        }
      
        linear(t) {
          return t;
        }
      
        cubic(t) {
          switch (this.easingDirection) {
            case Easing.EasingDirection.IN:
              return t * t * t;
            case Easing.EasingDirection.OUT:
              return 1 - Math.pow(1 - t, 3);
            case Easing.EasingDirection.IN_OUT:
              if (t < 0.5) {
                return 4 * t * t * t;
              } else {
                return 1 - Math.pow(-2 * t + 2, 3) / 2;
              }
            default:
              return t;
          }
        }
      
        exponential(t) {
          switch (this.easingDirection) {
            case Easing.EasingDirection.IN:
              return Math.pow(2, 10 * (t - 1));
            case Easing.EasingDirection.OUT:
              return 1 - Math.pow(2, -10 * t);
            case Easing.EasingDirection.IN_OUT:
              if (t < 0.5) {
                return Math.pow(2, 10 * (2 * t - 1)) / 2;
              } else {
                return 1 - Math.pow(2, -10 * (2 * t - 1)) / 2;
              }
            default:
              return t;
          }
        }
      }
})();