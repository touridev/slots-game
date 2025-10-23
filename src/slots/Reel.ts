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
    private hasSnapped: boolean = false; // Prevent multiple snapping calls

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
            // Create mask graphics with proper initialization
            const maskGraphics = new PIXI.Graphics();
            maskGraphics.beginFill(0xFFFFFF);
            maskGraphics.drawRect(0, 0, this.symbolSize * this.symbolCount, this.symbolSize);
            maskGraphics.endFill();
            
            // Set the mask on the symbols container
            this.symbolsContainer.mask = maskGraphics;
            
            // Add mask to container for rendering
            this.container.addChild(maskGraphics);
            
            // Ensure the mask is properly positioned
            maskGraphics.x = 0;
            maskGraphics.y = 0;
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
            // Ensure currentOffset is an integer to prevent accumulation of fractional values
            this.currentOffset = Math.round(this.currentOffset);
        }

        // Update all symbol positions
        this.updateSymbolPositions();

        // If we're stopping, slow down the reel
        if (!this.isSpinning && this.speed > 0) {
            this.speed *= REEL_CONFIG.SLOWDOWN_RATE;

            // If speed is low enough, snap to grid and stop completely
            if (this.speed < REEL_CONFIG.STOP_THRESHOLD && !this.hasSnapped) {
                this.speed = 0;
                this.snapToGrid();
            }
        }
    }

    private snapToGrid(): void {
        // Prevent multiple snapping calls
        if (this.hasSnapped) return;
        
        // Snap to the nearest symbol position smoothly
        const totalWidth = this.symbolCount * this.symbolSize;
        
        // Normalize currentOffset to 0-totalWidth range
        let normalizedOffset = this.currentOffset % totalWidth;
        if (normalizedOffset < 0) {
            normalizedOffset += totalWidth;
        }
        
        // Find the closest grid position (0, symbolSize, 2*symbolSize, etc.)
        const nearestGridPosition = Math.round(normalizedOffset / this.symbolSize) * this.symbolSize;
        
        // Ensure we snap to a valid grid position that shows exactly 5 symbols
        // The snapped position should be 0, symbolSize, 2*symbolSize, 3*symbolSize, or 4*symbolSize
        const snappedPosition = Math.min(nearestGridPosition, 4 * this.symbolSize);
        
        // Calculate the difference between current and target position
        const diff = normalizedOffset - snappedPosition;
        
        // Apply the correction to currentOffset immediately
        this.currentOffset = this.currentOffset - diff;
        // Ensure currentOffset is an integer after snapping
        this.currentOffset = Math.round(this.currentOffset);
        
        // Mark as snapped to prevent multiple calls
        this.hasSnapped = true;

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
            
            // Ensure position is an integer to prevent sub-pixel rendering
            wrappedX = Math.round(wrappedX);
            
            this.symbols[i].x = wrappedX;
            
            // Hide symbols that are outside the visible area
            if (wrappedX < -this.symbolSize || wrappedX > totalWidth) {
                this.symbols[i].visible = false;
            } else {
                this.symbols[i].visible = true;
            }
        }
    }

    public startSpin(): void {
        this.isSpinning = true;
        this.speed = REEL_CONFIG.SPIN_SPEED;
        this.hasSnapped = false; // Reset snapped flag for new spin
    }

    public stopSpin(): void {
        this.isSpinning = false;
        // The reel will gradually slow down in the update method
    }
}
