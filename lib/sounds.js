import { AudioObject } from "./audioObject.js";
import { AudioSource } from "./audioSource.js";

export const Sounds = (function () {
    return class Sounds {
        static sfxContext = new AudioContext();
        static musicContext = new AudioContext();

        static SND_STEP = new AudioSource('/assets/sounds/snd_step.ogg', Sounds.sfxContext);
        static SND_JUMP = new AudioSource('/assets/sounds/snd_jump.ogg', Sounds.sfxContext);
        static SND_GIFT_COLLECT = new AudioSource('/assets/sounds/snd_gift_collect.ogg', Sounds.sfxContext);
        static SND_DAMAGE = new AudioSource('/assets/sounds/snd_damage.ogg', Sounds.sfxContext);
        static SND_SMOOSH = new AudioSource('/assets/sounds/snd_smoosh.ogg', Sounds.sfxContext);
        static SND_BUTTON_SELECT = new AudioSource('/assets/sounds/snd_button_select.ogg', Sounds.sfxContext);
        static SND_IMPACT = new AudioSource('/assets/sounds/snd_impact.ogg', Sounds.sfxContext);
        static SND_BUTTON_PRESS = new AudioSource('/assets/sounds/snd_button_press.ogg', Sounds.sfxContext);
        static SND_EXPLOSION = new AudioSource('/assets/sounds/snd_explosion.ogg', Sounds.sfxContext);
        static SND_PROJECTILE_HIT = new AudioSource('/assets/sounds/snd_projectile_hit.wav', Sounds.sfxContext);
        static SND_FLAME = new AudioSource('/assets/sounds/snd_flame.ogg', Sounds.sfxContext);
        static SND_DEATH = new AudioSource('/assets/sounds/snd_death.wav', Sounds.sfxContext);
        static SND_SNOWMAN_BOSS_CHARGE = new AudioSource('/assets/sounds/snd_snowman_boss_charge.ogg', Sounds.sfxContext);
        static SND_SNOWMAN_BOSS_BUST = new AudioSource('/assets/sounds/snd_snowman_boss_bust.ogg', Sounds.sfxContext);
        static SND_COOKIE = new AudioSource('/assets/sounds/snd_cookie.wav', Sounds.sfxContext);
        static SND_TREE_COLLECT = new AudioSource('/assets/sounds/snd_tree_collect.ogg', Sounds.sfxContext);
        static SND_SCORE_IMPACT = new AudioSource('/assets/sounds/snd_score_impact.ogg', Sounds.sfxContext);

        static SND_THEME = new AudioSource('/assets/sounds/snd_theme.mp3', Sounds.musicContext);
        static SND_THEME_STINGER = new AudioSource('/assets/sounds/snd_theme_stinger.mp3', Sounds.musicContext);
        static SND_GRINCH_BOSS_THEME = new AudioSource('/assets/sounds/snd_grinch_boss_theme.mp3', Sounds.musicContext);
        static SND_GRINCH_BOSS_THEME_STINGER = new AudioSource('/assets/sounds/snd_grinch_boss_theme_stinger.mp3', Sounds.musicContext);
        static SND_SNOWMAN_BOSS_THEME = new AudioSource('/assets/sounds/snd_snowman_boss_theme.mp3', Sounds.musicContext);
        static SND_SNOWMAN_BOSS_THEME_STINGER = new AudioSource('/assets/sounds/snd_snowman_boss_theme_stinger.mp3', Sounds.musicContext);
        static SND_NIGHT_THEME = new AudioSource('/assets/sounds/snd_night_theme.mp3', Sounds.musicContext);
        static SND_NIGHT_THEME_STINGER = new AudioSource('/assets/sounds/snd_night_theme_stinger.mp3', Sounds.musicContext);
        static SND_TITLE_THEME = new AudioSource('/assets/sounds/snd_title_theme.mp3', Sounds.musicContext);
        static SND_TITLE_THEME_STINGER = new AudioSource('/assets/sounds/snd_title_theme_stinger.mp3', Sounds.musicContext);
        static SND_WORKSHOP_THEME = new AudioSource('/assets/sounds/snd_workshop_theme.mp3', Sounds.musicContext);
        static SND_WORKSHOP_THEME_STINGER = new AudioSource('/assets/sounds/snd_workshop_theme_stinger.mp3', Sounds.musicContext);

        static GLOBAL_VOLUME = 1;

        static MUSIC_DEFAULT_VOLUME = 0.25;
        static SFX_DEFAULT_VOLUME = 0.25;

        static user_SfxEnabled = true;
        static user_MusicEnabled = true;

        static system_SfxEnabled = true;
        static system_MusicEnabled = true;

        static currentTheme = null;

        static activeSounds = [];

        static async preloadAll() {
            let promises = Object.values(Sounds)
                .filter(sound => sound instanceof AudioSource)
                .map(sound => {
                    return sound.load();
                });

            return Promise.all(promises);
        }

        static allLoaded() {
            return Object.values(Sounds)
                .filter(sound => sound instanceof AudioSource)
                .every(sound => {
                    return sound.isLoaded();
                });
        }

        // plays the given audio object
        static play (audioObject, timePosition = 0) {
            audioObject.played.listen(() => {
                Sounds.activeSounds.push(audioObject);
            });
            
            audioObject.stopped.listen(() => {
                const index = Sounds.activeSounds.indexOf(audioObject);
                
                if (index === -1) { return; }

                Sounds.activeSounds.splice(index, 1);
            });

            audioObject.play(timePosition);
        }

        // plays a given sound effect once
        static async playSfx(audioSource, volume = Sounds.SFX_DEFAULT_VOLUME, rate = 1) {
            if (!Sounds.user_SfxEnabled || !Sounds.system_SfxEnabled) {
                return;
            }

            if (!(audioSource instanceof AudioSource)) {
                console.error('Invalid sound effect provided to playSfx()');
                return;
            }

            const soundEffect = new AudioObject(audioSource);
            soundEffect.setVolume(volume * Sounds.GLOBAL_VOLUME);
            soundEffect.setPlaybackRate(rate);

            Sounds.play(soundEffect);

            return soundEffect;
        }

        // plays a given theme sound and loops it
        // will stop the current theme if one is playing
        static async playTheme(audioSource, volume = Sounds.MUSIC_DEFAULT_VOLUME, crossfade = 0, loops = true, timePosition = 0) {
            if (!Sounds.user_MusicEnabled || !Sounds.system_MusicEnabled) {
                // themes are muted at the moment
                return;
            }

            if (Sounds.currentTheme && Sounds.currentTheme.audioSource === audioSource) {
                // the theme is already playing
                return;
            }

            if (!(audioSource instanceof AudioSource)) {
                console.error('Invalid theme provided to playTheme()');
                return;
            }

            if (Sounds.currentTheme !== null && crossfade === 0) {
                Sounds.currentTheme.pause();
            }

            let oldTheme = Sounds.currentTheme;
            let newTheme = new AudioObject(audioSource);

            Sounds.currentTheme = newTheme;
            Sounds.currentTheme.setVolume((crossfade > 0 ? 0 : volume) * Sounds.GLOBAL_VOLUME);
            Sounds.currentTheme.setLoop(loops);
            Sounds.play(Sounds.currentTheme, timePosition);

            // fade logic
            if (crossfade > 0) {
                if (oldTheme !== null && oldTheme !== newTheme) {
                    Sounds.tweenVolume(oldTheme, 0, crossfade);
                }

                Sounds.tweenVolume(newTheme, volume, crossfade);
            }

            return Sounds.currentTheme;
        }

        // stops the currently playing theme
        static stopTheme(fade = 0) {
            if (Sounds.currentTheme !== null) {
                if (fade <= 0) {
                    Sounds.currentTheme.pause();
                } else {
                    Sounds.tweenVolume(Sounds.currentTheme, 0, fade);
                }
                Sounds.currentTheme = null;
            }
        }

        // tweens the volume of the given sound
        static tweenVolume(sound, targetVolume, duration = 1) {
            const SMOOTHNESS = 10;

            let startingVolume = sound.volume;

            let isGettingLouder = targetVolume > startingVolume;
            let isGettingQuietter = targetVolume <= startingVolume;
            let step = (targetVolume - sound.volume) / (SMOOTHNESS * duration * 0.5);

            let tween = setInterval(() => {
                let nextVolume = sound.volume + step;

                if ((isGettingLouder && nextVolume >= targetVolume) || (isGettingQuietter && nextVolume <= targetVolume)) {
                    nextVolume = targetVolume;

                    if (nextVolume === 0) {
                        sound.pause();
                    }

                    clearInterval(tween);

                }

                sound.setVolume(nextVolume * Sounds.GLOBAL_VOLUME);
            }, (duration * 1000) / SMOOTHNESS);
        }

        // returns true if a theme is currently playing
        static isThemePlaying() {
            return Sounds.currentTheme !== null;
        }

        // suspends all active audio objects
        static suspendActiveObjects () {
            Sounds.activeSounds.forEach(sound => {
                sound.pause();
            });
            Sounds.currentTheme = null;
        }

        // mutes all sound effects
        static muteSfx(fromSystem) {
            if (fromSystem) {
                // game is muting sfx
                Sounds.system_SfxEnabled = false;
            } else {
                // user is muting sfx
                Sounds.user_SfxEnabled = false;
            }
            
            if ((!Sounds.user_SfxEnabled || !Sounds.system_SfxEnabled) && (!Sounds.user_MusicEnabled || !Sounds.system_MusicEnabled)) {
                // possibly not necessary, but just in case
                // since i've been having issues with audio continuing to play
                Sounds.suspendActiveObjects();
            }

            Sounds.sfxContext.suspend();
        }

        // unmutes all sound effects
        static unmuteSfx(fromSystem) {
            if (fromSystem && Sounds.user_SfxEnabled) {
                // game is unmuting sfx, only resume if user hasn't muted sfx
                Sounds.system_SfxEnabled = true;
                Sounds.sfxContext.resume();
            } else if (!fromSystem) {
                // user is unmuting sfx
                Sounds.user_SfxEnabled = true;
                Sounds.sfxContext.resume();
            }
        }

        // mutes all music
        static muteMusic(fromSystem = false) {
            if (fromSystem) {
                // game is muting music
                Sounds.system_MusicEnabled = false;
            } else {
                // user is muting music
                Sounds.user_MusicEnabled = false;
            }
            
            if ((!Sounds.user_SfxEnabled || !Sounds.system_SfxEnabled) && (!Sounds.user_MusicEnabled || !Sounds.system_MusicEnabled)) {
                Sounds.suspendActiveObjects();
            }
            
            Sounds.musicContext.suspend();
        }

        // unmutes all music
        static unmuteMusic(fromSystem = false) {
            if (fromSystem) {
                Sounds.system_MusicEnabled = true;
                
                // game is unmuting music, only resume if user hasn't muted music
                if (Sounds.user_MusicEnabled) {
                    Sounds.musicContext.resume();
                }
            } else if (!fromSystem) {
                // user is unmuting music
                Sounds.user_MusicEnabled = true;
                Sounds.musicContext.resume();
            }
        }

    }
})();