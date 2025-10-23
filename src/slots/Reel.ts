import * as PIXI from 'pixi.js';
import { AssetLoader } from '../utils/AssetLoader';
import { REEL_CONFIG } from '../utils/constants';

export class Reel {
    public container: PIXI.Container;
    private symbols: PIXI.Sprite[];
    private symbolSize: number;
    private symbolCount: number;
    private speed: number = 0;
    private isSpinning: boolean = false;
    private currentOffset: number = 0; // Track horizontal offset for snapping

    constructor(symbolCount: number, symbolSize: number) {
        this.container = new PIXI.Container();
        this.symbols = [];
        this.symbolSize = symbolSize;
        this.symbolCount = symbolCount;

        this.createSymbols();
    }

    private createSymbols(): void {
        // Create symbols for the reel, arranged horizontally
        for (let i = 0; i < this.symbolCount; i++) {
            const symbol = this.createRandomSymbol();
            symbol.x = i * this.symbolSize;
            this.symbols.push(symbol);
            this.container.addChild(symbol);
        }
    }

    private createRandomSymbol(): PIXI.Sprite {
        // Get a random symbol texture
        const randomIndex = Math.floor(Math.random() * REEL_CONFIG.SYMBOL_TEXTURES.length);
        const textureName = REEL_CONFIG.SYMBOL_TEXTURES[randomIndex];
        const texture = AssetLoader.getTexture(textureName);

        // Create a sprite with the texture
        const sprite = new PIXI.Sprite(texture);
        sprite.width = this.symbolSize;
        sprite.height = this.symbolSize;

        return sprite;
    }

    public update(delta: number): void {
        if (!this.isSpinning && this.speed === 0) return;

        // Move symbols horizontally
        if (this.isSpinning) {
            this.currentOffset -= this.speed * delta;
        }

        // Update symbol positions
        for (let i = 0; i < this.symbols.length; i++) {
            let x = i * this.symbolSize + this.currentOffset;
            
            // Wrap symbols around (tiling effect)
            const totalWidth = this.symbolCount * this.symbolSize;
            if (x < -this.symbolSize) {
                x += totalWidth;
            } else if (x >= totalWidth) {
                x -= totalWidth;
            }
            
            this.symbols[i].x = x;
        }

        // If we're stopping, slow down the reel
        if (!this.isSpinning && this.speed > 0) {
            this.speed *= REEL_CONFIG.SLOWDOWN_RATE;

            // If speed is very low, stop completely and snap to grid
            if (this.speed < REEL_CONFIG.STOP_THRESHOLD) {
                this.speed = 0;
                this.snapToGrid();
            }
        }
    }

    private snapToGrid(): void {
        // Snap to the nearest symbol position
        const remainder = this.currentOffset % this.symbolSize;
        const isNegative = this.currentOffset < 0;
        
        if (isNegative) {
            this.currentOffset -= remainder === 0 ? 0 : this.symbolSize - Math.abs(remainder);
        } else {
            this.currentOffset -= remainder;
        }

        // Update all symbol positions to snap to grid
        for (let i = 0; i < this.symbols.length; i++) {
            let x = i * this.symbolSize + this.currentOffset;
            
            // Wrap symbols around
            const totalWidth = this.symbolCount * this.symbolSize;
            if (x < -this.symbolSize) {
                x += totalWidth;
            } else if (x >= totalWidth) {
                x -= totalWidth;
            }
            
            this.symbols[i].x = x;
        }
    }

    public startSpin(): void {
        this.isSpinning = true;
        this.speed = REEL_CONFIG.SPIN_SPEED;
    }

    public stopSpin(): void {
        this.isSpinning = false;
        // The reel will gradually slow down in the update method
    }
}
