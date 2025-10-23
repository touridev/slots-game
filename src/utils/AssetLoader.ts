import * as PIXI from 'pixi.js';
import { sound } from './sound';

// Asset paths
const IMAGES_PATH = 'assets/images/';
const SPINES_PATH = 'assets/spines/';
const SOUNDS_PATH = 'assets/sounds/';

// Asset lists
const IMAGES = [
    'symbol1.png',
    'symbol2.png',
    'symbol3.png',
    'symbol4.png',
    'symbol5.png',
    'background.png',
    'button_spin.png',
    'button_spin_disabled.png',
];

const SPINES = [
    'big-boom-h.json',
    'base-feature-frame.json'
];


const SOUNDS = [
    'Reel spin.webm',
    'win.webm',
    'Spin button.webm',
];

const textureCache: Record<string, PIXI.Texture> = {};
const spineCache: Record<string, any> = {};

export class AssetLoader {
    constructor() {
        PIXI.Assets.init({ basePath: '' });
    }

    public async loadAssets(): Promise<void> {
        try {
            PIXI.Assets.addBundle('images', IMAGES.map(image => ({
                name: image,
                srcs: IMAGES_PATH + image
            })));

            PIXI.Assets.addBundle('spines', SPINES.map(spine => ({
                name: spine,
                srcs: SPINES_PATH + spine
            })));

            const imageAssets = await PIXI.Assets.loadBundle('images');
            console.log('Images loaded successfully');

            for (const [key, texture] of Object.entries(imageAssets)) {
                textureCache[key] = texture as PIXI.Texture;
            }

            try {
                const spineAssets = await PIXI.Assets.loadBundle('spines');
                console.log('Spine animations loaded successfully');

                for (const [key, spine] of Object.entries(spineAssets)) {
                    spineCache[key] = spine;
                }
            } catch (error) {
                console.error('Error loading spine animations:', error);
            }

            await this.loadSounds();
            console.log('Assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            throw error;
        }
    }

    private async loadSounds(): Promise<void> {
        try {
            SOUNDS.forEach(soundFile => {
                sound.add(soundFile.split('.')[0], SOUNDS_PATH + soundFile);
            });
        } catch (error) {
            console.error('Error loading sounds:', error);
            throw error;
        }
    }

    public static getTexture(name: string): PIXI.Texture {
        return textureCache[name];
    }

    public static getSpine(name: string): any {
        return spineCache[name];
    }
}
