// TODO: Implement sound player using the "howler" package
import { Howl } from 'howler';

interface SoundLibrary {
    [key: string]: Howl;
}

const soundLibrary: SoundLibrary = {};

export const sound = {
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
