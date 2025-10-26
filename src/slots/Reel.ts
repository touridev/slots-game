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
    private isSnapping: boolean = false; // Track if we're currently animating to snap position
    private snapTarget: number = 0; // Target position for smooth snapping

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
        
        // TODO: Maybe add some visual effects here later
        // console.log('Created symbols:', this.symbols.length);
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
        
        // Add some subtle variation to make it look more natural
        sprite.alpha = 0.95 + Math.random() * 0.1; // slight opacity variation
        
        // Add some random rotation for variety (very subtle)
        sprite.rotation = (Math.random() - 0.5) * 0.1; // ±0.05 radians

        return sprite;
    }

    public update(delta: number): void {
        // Normalize delta - PIXI ticker provides frame time, we want a multiplier around 1.0
        const normalizedDelta = Math.min(delta / (1000 / 60), 2.0); // Cap at 2x for stability

        // Handle smooth snapping animation
        if (this.isSnapping && !this.isSpinning) {
            const diff = this.snapTarget - this.currentOffset;
            const distance = Math.abs(diff);
            
            if (distance > 0.5) {
                // Smoothly animate towards snap position with easing
                // Use exponential ease-out for smooth deceleration
                const snapSpeed = distance * 0.5 * normalizedDelta;
                const moveDistance = Math.min(snapSpeed, distance);
                this.currentOffset += Math.sign(diff) * moveDistance;
            } else {
                // We're close enough, snap to exact position
                this.currentOffset = this.snapTarget;
                this.isSnapping = false;
            }
            
            this.updateSymbolPositions();
            return;
        }

        // If not spinning and not snapping and speed is zero, no update needed
        if (!this.isSpinning && this.speed === 0 && !this.isSnapping) return;

        // Move symbols horizontally (both during spin and during slowdown)
        if (this.speed > 0) {
            this.currentOffset -= this.speed * normalizedDelta;
            // Don't round here to allow smooth fractional movement
        }

        // Update all symbol positions
        this.updateSymbolPositions();

        // If we're stopping, slow down the reel smoothly until we reach snap position
        if (!this.isSpinning && this.speed > 0) {
            // Continue reducing speed
            this.speed *= REEL_CONFIG.SLOWDOWN_RATE;
            
            // If speed is low enough, prepare snap target and continue smoothly
            if (this.speed < REEL_CONFIG.STOP_THRESHOLD && !this.hasSnapped) {
                // Calculate where we want to snap to
                this.prepareSnap();
            }
            
            // Keep moving until we reach close to the target
            if (this.hasSnapped && !this.isSnapping) {
                const distanceToTarget = Math.abs(this.currentOffset - this.snapTarget);
                
                // If we're very close to target or speed is almost zero, finalize
                if (distanceToTarget < 5 || this.speed < 0.1) {
                    this.speed = 0;
                    // Trigger snap animation to finish smoothly
                    this.isSnapping = true;
                }
            }
        }
    }

    private prepareSnap(): void {
        // Prevent multiple snapping calls
        if (this.hasSnapped) return;
        
        // Normalize currentOffset to a positive value between 0 and totalWidth
        const totalWidth = this.symbolCount * this.symbolSize;
        
        // Get the wrapped position
        let wrappedPosition = this.currentOffset % totalWidth;
        if (wrappedPosition < 0) {
            wrappedPosition += totalWidth;
        }
        
        // Find the closest grid position (snap to symbol boundaries)
        let targetPosition = Math.round(wrappedPosition / this.symbolSize) * this.symbolSize;
        
        // Ensure target is within valid range
        targetPosition = Math.max(0, Math.min(targetPosition, totalWidth - this.symbolSize));
        
        // Set the target - this should be the absolute position we want to reach
        // To work properly, we need to calculate how many full cycles of wrapping we're at
        const cycles = Math.floor(this.currentOffset / totalWidth);
        this.snapTarget = cycles * totalWidth + targetPosition;
        
        // Normalize currentOffset for smooth animation
        this.currentOffset = wrappedPosition;
        
        // Start the smooth snapping animation
        this.isSnapping = true;
        this.hasSnapped = true;
    }

    private snapToGrid(): void {
        // Final snap to exact position (used internally if needed)
        this.currentOffset = this.snapTarget;
        this.isSnapping = false;
        this.updateSymbolPositions();
    }

    /**
     * Updates all symbol positions based on current offset
     */
    private updateSymbolPositions(): void {
        const totalWidth = this.symbolCount * this.symbolSize;

        for (let i = 0; i < this.symbols.length; i++) {
            let x = i * this.symbolSize + this.currentOffset;
            
            // Calculate wrapped X position
            let wrappedX = x % totalWidth;
            if (wrappedX < 0) {
                wrappedX += totalWidth;
            }
            if (wrappedX >= totalWidth) {
                wrappedX -= totalWidth;
            }

            // For smooth animation, allow fractional positions
            // Round to exact pixel positions when animation is complete
            if (!this.isSnapping && !this.isSpinning && Math.abs(this.speed) < 0.1) {
                wrappedX = Math.round(wrappedX);
            }

            this.symbols[i].x = wrappedX;
            
            // Ensure y position is always 0 for horizontal reels
            this.symbols[i].y = 0;
            
            // All symbols should be visible - mask will handle clipping
            this.symbols[i].visible = true;
        }
    }

    public startSpin(): void {
        this.isSpinning = true;
        this.speed = REEL_CONFIG.SPIN_SPEED;
        this.hasSnapped = false; // Reset snapped flag for new spin
        this.isSnapping = false; // Reset snapping state
        
        // Add some randomness to make it feel more natural
        this.speed += Math.random() * 10 - 5; // ±5 speed variation
        
        // Add some visual feedback
        this.symbolsContainer.alpha = 0.9;
        setTimeout(() => {
            this.symbolsContainer.alpha = 1.0;
        }, 100);
    }

    public stopSpin(): void {
        this.isSpinning = false;
        // The reel will gradually slow down in the update method
    }

    /**
     * Check if the reel animation is completely finished
     */
    public isAnimationComplete(): boolean {
        return !this.isSpinning && this.speed === 0 && !this.isSnapping;
    }
}
