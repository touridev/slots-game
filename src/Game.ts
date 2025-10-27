import * as PIXI from 'pixi.js';
import { SlotMachine } from './slots/SlotMachine';
import { AssetLoader } from './utils/AssetLoader';
import { UI } from './ui/UI';
import { configManager } from './core/ConfigManager';
import { eventManager } from './core/EventManager';
import { performanceMonitor } from './core/PerformanceMonitor';

export class Game {
    private app: PIXI.Application;
    private slotMachine!: SlotMachine;
    private ui!: UI;
    private assetLoader: AssetLoader;

    constructor() {
        const displayConfig = configManager.get('display');
        
        this.app = new PIXI.Application({
            width: displayConfig.width,
            height: displayConfig.height,
            backgroundColor: displayConfig.backgroundColor,
            resolution: displayConfig.resolution,
            autoDensity: displayConfig.autoDensity,
        });

        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.app.view as HTMLCanvasElement);
        }

        this.assetLoader = new AssetLoader();

        this.init = this.init.bind(this);
        this.resize = this.resize.bind(this);
        this.update = this.update.bind(this);

        window.addEventListener('resize', this.resize);
        this.setupEventListeners();

        this.resize();
    }

    public async init(): Promise<void> {
        try {
            await this.assetLoader.loadAssets();
            
            eventManager.emit('asset:loaded', { 
                assetType: 'all', 
                count: 1 
            });

            this.slotMachine = new SlotMachine(this.app);
            this.app.stage.addChild(this.slotMachine.container);

            this.ui = new UI(this.app, this.slotMachine);
            this.app.stage.addChild(this.ui.container);

            this.app.ticker.add(this.update);

            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Error initializing game:', error);
            eventManager.emit('error:occurred', { 
                error: error as Error, 
                context: 'Game initialization' 
            });
        }
    }

    private update(delta: number): void {
        if (this.slotMachine) {
            this.slotMachine.update(delta);
        }
        
        performanceMonitor.update(delta, this.app.renderer);
        
        const debugConfig = configManager.get('debug');
        if (debugConfig.enabled && debugConfig.showPerformanceMetrics) {
            const metrics = performanceMonitor.getMetrics();
            if (metrics.fps < 30) {
                console.warn('Low FPS detected:', metrics.fps);
            }
        }
    }

    private resize(): void {
        if (!this.app || !this.app.renderer) return;

        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) return;

        const displayConfig = configManager.get('display');
        const w = gameContainer.clientWidth;
        const h = gameContainer.clientHeight;

        const scale = Math.min(w / displayConfig.width, h / displayConfig.height);

        this.app.stage.scale.set(scale);

        this.app.renderer.resize(w, h);
        this.app.stage.position.set(w / 2, h / 2);
        this.app.stage.pivot.set(displayConfig.width / 2, displayConfig.height / 2);
    }

    private setupEventListeners(): void {
        eventManager.on('error:occurred', (data) => {
            console.error('Game error:', data.error, 'Context:', data.context);
        });
        
        eventManager.on('win:detected', (data) => {
            console.log('Win detected:', data.winType, 'Multiplier:', data.multiplier);
        });
    }

    public destroy(): void {
        if (this.slotMachine) {
            this.slotMachine.destroy();
        }
        
        if (this.ui) {
            this.ui.container.destroy();
        }
        
        this.app.destroy();
        window.removeEventListener('resize', this.resize);
    }
}
