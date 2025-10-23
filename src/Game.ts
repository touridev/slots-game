import * as PIXI from 'pixi.js';
import { SlotMachine } from './slots/SlotMachine';
import { AssetLoader } from './utils/AssetLoader';
import { UI } from './ui/UI';
import { GAME_CONFIG } from './utils/constants';

/**
 * Main Game class that manages the application, rendering, and game lifecycle
 */
export class Game {
    private app: PIXI.Application;
    private slotMachine!: SlotMachine;
    private ui!: UI;
    private assetLoader: AssetLoader;

    constructor() {
        this.app = new PIXI.Application({
            width: GAME_CONFIG.WIDTH,
            height: GAME_CONFIG.HEIGHT,
            backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.app.view as HTMLCanvasElement);
        }

        this.assetLoader = new AssetLoader();

        this.init = this.init.bind(this);
        this.resize = this.resize.bind(this);

        window.addEventListener('resize', this.resize);

        this.resize();
    }

    /**
     * Initializes the game by loading assets and setting up the slot machine and UI
     */
    public async init(): Promise<void> {
        try {
            await this.assetLoader.loadAssets();

            this.slotMachine = new SlotMachine(this.app);
            this.app.stage.addChild(this.slotMachine.container);

            this.ui = new UI(this.app, this.slotMachine);
            this.app.stage.addChild(this.ui.container);

            this.app.ticker.add(this.update.bind(this));

            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    }

    /**
     * Updates the game state for each frame
     */
    private update(delta: number): void {
        if (this.slotMachine) {
            this.slotMachine.update(delta);
        }
    }

    /**
     * Handles window resizing and adjusts the game canvas accordingly
     */
    private resize(): void {
        if (!this.app || !this.app.renderer) return;

        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        const w = gameContainer.clientWidth;
        const h = gameContainer.clientHeight;

        // Calculate scale to fit the container while maintaining aspect ratio
        const scale = Math.min(w / GAME_CONFIG.WIDTH, h / GAME_CONFIG.HEIGHT);

        this.app.stage.scale.set(scale);

        // Center the stage
        this.app.renderer.resize(w, h);
        this.app.stage.position.set(w / 2, h / 2);
        this.app.stage.pivot.set(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    }
}
