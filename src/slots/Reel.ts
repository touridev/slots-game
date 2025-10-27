import * as PIXI from 'pixi.js';
import { AssetLoader } from '../utils/AssetLoader';
import { configManager } from '../core/ConfigManager';
import { spritePool } from '../core/SpritePool';
import { eventManager } from '../core/EventManager';

export class Reel {
    public container: PIXI.Container;
    private symbolsContainer: PIXI.Container;
    private symbols: PIXI.Sprite[];
    private symbolSize: number;
    private symbolCount: number;
    private speed: number = 0;
    private isSpinning: boolean = false;
    private currentOffset: number = 0;
    private hasSnapped: boolean = false;
    private isSnapping: boolean = false;
    private snapTarget: number = 0;
    private reelIndex: number;
    private lastUpdateTime: number = 0;
    private animationId: number | null = null;

    constructor(symbolCount: number, symbolSize: number, reelIndex: number = 0) {
        this.container = new PIXI.Container();
        this.symbolsContainer = new PIXI.Container();
        this.symbols = [];
        this.symbolSize = symbolSize;
        this.symbolCount = symbolCount;
        this.reelIndex = reelIndex;

        this.createSymbols();
        this.addViewportClipping();

        this.updateSymbolPositions();

        this.container.addChild(this.symbolsContainer);
    }

    public get children(): PIXI.DisplayObject[] {
        return this.symbolsContainer.children;
    }

    private addViewportClipping(): void {
        try {
            const maskGraphics = new PIXI.Graphics();
            maskGraphics.beginFill(0xFFFFFF);
            maskGraphics.drawRect(0, 0, this.symbolSize * this.symbolCount, this.symbolSize);
            maskGraphics.endFill();

            this.symbolsContainer.mask = maskGraphics;
            this.container.addChild(maskGraphics);

            maskGraphics.x = 0;
            maskGraphics.y = 0;
        } catch (error) {
            console.debug('Could not create visual mask');
        }
    }

    private createSymbols(): void {
        const config = configManager.get('reels');
        const useObjectPooling = configManager.get('performance', 'enableObjectPooling');

        for (let i = 0; i < this.symbolCount; i++) {
            const symbol = this.createRandomSymbol(useObjectPooling);
            symbol.x = i * this.symbolSize;
            this.symbols.push(symbol);
            this.symbolsContainer.addChild(symbol);
        }
    }

    private createRandomSymbol(useObjectPooling: boolean = false): PIXI.Sprite {
        const config = configManager.get('reels');

        const randomIndex = Math.floor(Math.random() * config.symbolTextures.length);
        const textureName = config.symbolTextures[randomIndex];

        let sprite: PIXI.Sprite;

        if (useObjectPooling) {
            sprite = spritePool.getSprite(textureName, this.symbolSize, this.symbolSize);
        } else {
            const texture = AssetLoader.getTexture(textureName);
            sprite = new PIXI.Sprite(texture);
            sprite.width = this.symbolSize;
            sprite.height = this.symbolSize;
        }

        sprite.alpha = 0.95 + Math.random() * 0.1;
        sprite.rotation = (Math.random() - 0.5) * 0.1;

        return sprite;
    }

    public update(delta: number): void {
        const currentTime = performance.now();

        if (currentTime - this.lastUpdateTime < 16) {
            return;
        }

        this.lastUpdateTime = currentTime;

        const normalizedDelta = Math.min(delta / (1000 / 60), 2.0);

        const config = configManager.get('reels');

        if (this.isSnapping && !this.isSpinning) {
            const diff = this.snapTarget - this.currentOffset;
            const distance = Math.abs(diff);

            if (distance > 0.5) {
                const snapSpeed = distance * 0.5 * normalizedDelta;
                const moveDistance = Math.min(snapSpeed, distance);
                this.currentOffset += Math.sign(diff) * moveDistance;
            } else {
                this.currentOffset = this.snapTarget;
                this.isSnapping = false;
            }

            this.updateSymbolPositions();
            return;
        }

        if (!this.isSpinning && this.speed === 0 && !this.isSnapping) return;

        if (this.speed > 0) {
            this.currentOffset -= this.speed * normalizedDelta;
        }

        this.updateSymbolPositions();

        if (!this.isSpinning && this.speed > 0) {
            this.speed *= config.slowdownRate;

            if (this.speed < config.stopThreshold && !this.hasSnapped) {
                this.prepareSnap();
            }

            if (this.hasSnapped && !this.isSnapping) {
                const distanceToTarget = Math.abs(this.currentOffset - this.snapTarget);

                if (distanceToTarget < 5 || this.speed < 0.1) {
                    this.speed = 0;
                    this.isSnapping = true;
                }
            }
        }
    }

    private prepareSnap(): void {
        if (this.hasSnapped) return;

        const totalWidth = this.symbolCount * this.symbolSize;

        let wrappedPosition = this.currentOffset % totalWidth;
        if (wrappedPosition < 0) {
            wrappedPosition += totalWidth;
        }

        let targetPosition = Math.round(wrappedPosition / this.symbolSize) * this.symbolSize;

        targetPosition = Math.max(0, Math.min(targetPosition, totalWidth - this.symbolSize));

        const cycles = Math.floor(this.currentOffset / totalWidth);
        this.snapTarget = cycles * totalWidth + targetPosition;

        this.currentOffset = wrappedPosition;

        this.isSnapping = true;
        this.hasSnapped = true;
    }

    private snapToGrid(): void {
        this.currentOffset = this.snapTarget;
        this.isSnapping = false;
        this.updateSymbolPositions();
    }

    private updateSymbolPositions(): void {
        const totalWidth = this.symbolCount * this.symbolSize;

        for (let i = 0; i < this.symbols.length; i++) {
            let x = i * this.symbolSize + this.currentOffset;

            let wrappedX = x % totalWidth;
            if (wrappedX < 0) {
                wrappedX += totalWidth;
            }
            if (wrappedX >= totalWidth) {
                wrappedX -= totalWidth;
            }

            if (!this.isSnapping && !this.isSpinning && Math.abs(this.speed) < 0.1) {
                wrappedX = Math.round(wrappedX);
            }

            this.symbols[i].x = wrappedX;
            this.symbols[i].y = 0;
            this.symbols[i].visible = true;
        }
    }

    public startSpin(): void {
        this.isSpinning = true;
        const config = configManager.get('reels');
        this.speed = config.spinSpeed;
        this.hasSnapped = false;
        this.isSnapping = false;

        this.speed += Math.random() * 10 - 5;

        this.symbolsContainer.alpha = 0.9;
        setTimeout(() => {
            this.symbolsContainer.alpha = 1.0;
        }, 100);

        eventManager.emit('spin:start', { timestamp: Date.now() });
    }

    public stopSpin(): void {
        this.isSpinning = false;

        eventManager.emit('reel:stopped', { reelIndex: this.reelIndex });
    }

    public isAnimationComplete(): boolean {
        return !this.isSpinning && this.speed === 0 && !this.isSnapping;
    }

    public destroy(): void {
        const useObjectPooling = configManager.get('performance', 'enableObjectPooling');

        if (useObjectPooling) {
            this.symbols.forEach(sprite => spritePool.returnSprite(sprite));
        } else {
            this.symbols.forEach(sprite => sprite.destroy());
        }

        this.symbols = [];
        this.container.destroy();
    }

    public getReelIndex(): number {
        return this.reelIndex;
    }
}
