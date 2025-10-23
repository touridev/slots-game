import * as PIXI from 'pixi.js';
import { AssetLoader } from '../utils/AssetLoader';
import { REEL_CONFIG } from '../utils/constants';

export class Reel {
    public container: PIXI.Container;
    private symbolsContainer: PIXI.Container;
    private symbols: PIXI.Sprite[];
    private symbolSize: number;
    private symbolCount: number;
    private speed: number = 0;
    private isSpinning: boolean = false;
    private currentOffset: number = 0; // Track horizontal offset for snapping

    constructor(symbolCount: number, symbolSize: number) {
        this.container = new PIXI.Container();
        this.symbolsContainer = new PIXI.Container();
        this.symbols = [];
        this.symbolSize = symbolSize;
        this.symbolCount = symbolCount;

        this.createSymbols();
        this.addViewportClipping();
        
        // Initialize symbols to grid-aligned positions
        this.updateSymbolPositions();
        
        this.container.addChild(this.symbolsContainer);
    }

    /**
     * Getter for accessing container children (for testing compatibility)
     */
    public get children(): PIXI.DisplayObject[] {
        return this.symbolsContainer.children;
    }

    private addViewportClipping(): void {
        // Create a clipping rectangle to show only the visible reel area
        try {
            const clipArea = new PIXI.Rectangle(0, 0, this.symbolSize * this.symbolCount, this.symbolSize);
            this.symbolsContainer.hitArea = clipArea;
            this.symbolsContainer.mask = new PIXI.Graphics()
                .beginFill(0xFFFFFF)
                .drawRect(0, 0, this.symbolSize * this.symbolCount, this.symbolSize)
                .endFill();
            this.container.addChild(this.symbolsContainer.mask);
        } catch (error) {
            // Mask might fail in test environment, that's okay
            console.debug('Could not create visual mask (expected in test environment)');
        }
    }

    private createSymbols(): void {
        // Create symbols for the reel, arranged horizontally
        for (let i = 0; i < this.symbolCount; i++) {
            const symbol = this.createRandomSymbol();
            symbol.x = i * this.symbolSize;
            this.symbols.push(symbol);
            this.symbolsContainer.addChild(symbol);
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

        // Update all symbol positions
        this.updateSymbolPositions();

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
        // Snap to the nearest symbol position smoothly
        const totalWidth = this.symbolCount * this.symbolSize;
        
        // Normalize currentOffset to 0-totalWidth range
        let normalizedOffset = this.currentOffset % totalWidth;
        if (normalizedOffset < 0) {
            normalizedOffset += totalWidth;
        }
        
        // Find the closest grid position
        const nearestGridPosition = Math.round(normalizedOffset / this.symbolSize) * this.symbolSize;
        
        // Ensure nearest grid position is within bounds (0 to totalWidth)
        const snappedPosition = nearestGridPosition >= totalWidth ? 0 : nearestGridPosition;
        
        // Update currentOffset to the snapped position
        // Calculate the difference to maintain smooth transition
        const diff = normalizedOffset - snappedPosition;
        if (Math.abs(diff) > 0.1) {
            // Apply the difference to snap smoothly
            this.currentOffset = this.currentOffset - diff;
        } else {
            // Already close to a grid position
            this.currentOffset = snappedPosition - (this.currentOffset - normalizedOffset);
        }

        // Update all symbol positions
        this.updateSymbolPositions();
    }

    /**
     * Updates all symbol positions based on current offset
     */
    private updateSymbolPositions(): void {
        const totalWidth = this.symbolCount * this.symbolSize;
        
        for (let i = 0; i < this.symbols.length; i++) {
            let x = i * this.symbolSize + this.currentOffset;
            
            // Smooth wrapping
            let wrappedX = x % totalWidth;
            if (wrappedX < 0) {
                wrappedX += totalWidth;
            }
            
            this.symbols[i].x = wrappedX;
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
