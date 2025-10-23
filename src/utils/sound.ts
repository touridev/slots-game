// TODO: Implement sound player using the "howler" package
import { Howl } from 'howler';

/**
 * Type definition for sound library storage
 */
interface SoundLibrary {
    [key: string]: Howl;
}

const soundLibrary: SoundLibrary = {};

/**
 * Sound player module that manages audio playback using Howler.js
 * Provides methods to add and play sounds throughout the game
 */
export const sound = {
    /**
     * Adds a sound to the library and loads it
     * @param alias - The alias to reference the sound by
     * @param url - The URL to the sound file
     */
    add: (alias: string, url: string): void => {
        try {
            soundLibrary[alias] = new Howl({
                src: [url],
                html5: true,
                preload: true,
                onloaderror: (id: number, error: unknown) => {
                    console.error(`Error loading sound ${alias}:`, error);
                },
            });
            console.log(`Sound added: ${alias} from ${url}`);
        } catch (error) {
            console.error(`Failed to add sound ${alias}:`, error);
        }
    },
    /**
     * Plays a sound by its alias
     * @param alias - The alias of the sound to play
     */
    play: (alias: string): void => {
        try {
            const soundFile = soundLibrary[alias];
            if (soundFile) {
                soundFile.play();
                console.log(`Playing sound: ${alias}`);
            } else {
                console.warn(`Sound not found: ${alias}`);
            }
        } catch (error) {
            console.error(`Failed to play sound ${alias}:`, error);
        }
    }
};
