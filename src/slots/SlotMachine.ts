import * as PIXI from 'pixi.js';
import 'pixi-spine';
import { Reel } from './Reel';
import { sound } from '../utils/sound';
import { AssetLoader } from '../utils/AssetLoader';
import { configManager } from '../core/ConfigManager';
import { eventManager } from '../core/EventManager';
import { performanceMonitor } from '../core/PerformanceMonitor';
import { Spine } from 'pixi-spine';

export class SlotMachine {
    public container: PIXI.Container;
    private reels: Reel[];
    private app: PIXI.Application;
    private isSpinning: boolean = false;
    private spinButton: PIXI.Sprite | null = null;
    private frameSpine: Spine | null = null;
    private winAnimation: Spine | null = null;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.container = new PIXI.Container();
        this.reels = [];

        const config = configManager.get('reels');
        const displayConfig = configManager.get('display');

        this.container.x = displayConfig.width / 2 - ((config.symbolSize * config.symbolsPerReel) / 2);
        this.container.y = displayConfig.height / 2 - ((config.symbolSize * config.count + config.reelSpacing * (config.count - 1)) / 2);

        this.createBackground();
        this.createReels();
        this.initSpineAnimations();
        this.setupEventListeners();
    }

    private createBackground(): void {
        try {
            const config = configManager.get('reels');
            const background = new PIXI.Graphics();
            background.beginFill(0x000000, 0.5);
            background.drawRect(
                -20,
                -20,
                config.symbolSize * config.symbolsPerReel + 40,
                config.symbolSize * config.count + config.reelSpacing * (config.count - 1) + 40
            );
            background.endFill();
            this.container.addChild(background);
        } catch (error) {
            console.error('Error creating background:', error);
        }
    }

    private createReels(): void {
        const config = configManager.get('reels');
        
        for (let i = 0; i < config.count; i++) {
            const reel = new Reel(config.symbolsPerReel, config.symbolSize, i);
            reel.container.y = i * (config.symbolSize + config.reelSpacing);
            this.container.addChild(reel.container);
            this.reels.push(reel);
        }
    }

    public update(delta: number): void {
        performanceMonitor.update(delta, this.app.renderer);
        
        for (const reel of this.reels) {
            reel.update(delta);
        }
    }

    public spin(): void {
        if (this.isSpinning) return;

        this.isSpinning = true;
        const animationConfig = configManager.get('animation');

        sound.play('Reel spin');

        if (this.spinButton) {
            this.spinButton.texture = AssetLoader.getTexture('button_spin_disabled.png');
            this.spinButton.interactive = false;
        }

        for (let i = 0; i < this.reels.length; i++) {
            setTimeout(() => {
                this.reels[i].startSpin();
            }, i * animationConfig.reelSpinDelay);
        }

        setTimeout(() => {
            this.stopSpin();
        }, animationConfig.spinTotalDuration + (this.reels.length - 1) * animationConfig.reelSpinDelay);
        
        eventManager.emit('spin:start', { timestamp: Date.now() });
    }

    private stopSpin(): void {
        const animationConfig = configManager.get('animation');
        
        for (let i = 0; i < this.reels.length; i++) {
            setTimeout(() => {
                this.reels[i].stopSpin();

                if (i === this.reels.length - 1) {
                    const checkReelsComplete = () => {
                        const allComplete = this.reels.every(reel => reel.isAnimationComplete());
                        
                        if (allComplete) {
                            this.checkWin();
                            this.isSpinning = false;

                            if (this.spinButton) {
                                this.spinButton.texture = AssetLoader.getTexture('button_spin.png');
                                this.spinButton.interactive = true;
                            }
                            
                            eventManager.emit('spin:stop', { timestamp: Date.now() });
                        } else {
                            setTimeout(checkReelsComplete, 50);
                        }
                    };
                    
                    setTimeout(checkReelsComplete, 100);
                }
            }, i * animationConfig.reelStopDelay);
        }
    }

    private checkWin(): void {
        const winConfig = configManager.get('win');
        const animationConfig = configManager.get('animation');
        
        const randomWin = Math.random() < winConfig.winChance;

        if (randomWin) {
            sound.play('win');
            console.log('Winner! 🎉');

            if (this.winAnimation) {
                this.winAnimation.visible = true;
                
                const animationName = this.winAnimation.state.hasAnimation('animation') 
                    ? 'animation' 
                    : this.getFirstAnimationName(this.winAnimation);
                
                if (animationName) {
                    this.winAnimation.state.setAnimation(0, animationName, false);
                } else {
                    console.warn('No animations found in win animation spine');
                }
                
                setTimeout(() => {
                    this.winAnimation!.visible = false;
                }, animationConfig.winAnimationDuration);
            }
            
            eventManager.emit('win:detected', { 
                winType: 'standard', 
                multiplier: winConfig.bonusMultiplier 
            });
        }
    }

    private getFirstAnimationName(spine: Spine): string | null {
        try {
            if (spine.spineData && spine.spineData.animations && spine.spineData.animations.length > 0) {
                return spine.spineData.animations[0].name;
            }
        } catch (error) {
            console.error('Error getting animation name:', error);
        }
        return null;
    }

    public setSpinButton(button: PIXI.Sprite): void {
        this.spinButton = button;
    }

    private initSpineAnimations(): void {
        try {
            const config = configManager.get('reels');
            
            const frameSpineData = AssetLoader.getSpine('base-feature-frame.json');
            if (frameSpineData) {
                this.frameSpine = new Spine(frameSpineData.spineData);

                this.frameSpine.y = (config.symbolSize * config.count + config.reelSpacing * (config.count - 1)) / 2;
                this.frameSpine.x = (config.symbolSize * config.symbolsPerReel) / 2;

                if (this.frameSpine.state.hasAnimation('idle')) {
                    this.frameSpine.state.setAnimation(0, 'idle', true);
                }

                this.container.addChild(this.frameSpine);
            }

            const winSpineData = AssetLoader.getSpine('big-boom-h.json');
            if (winSpineData) {
                this.winAnimation = new Spine(winSpineData.spineData);

                this.winAnimation.x = (config.symbolSize * config.count + config.reelSpacing * (config.count - 1)) / 2;
                this.winAnimation.y = (config.symbolSize * config.symbolsPerReel) / 2;

                this.winAnimation.visible = false;

                this.container.addChild(this.winAnimation);
            }
        } catch (error) {
            console.error('Error initializing spine animations:', error);
        }
    }

    private setupEventListeners(): void {
        eventManager.on('error:occurred', (data) => {
            console.error('Game error:', data.error, 'Context:', data.context);
        });
    }

    public destroy(): void {
        this.reels.forEach(reel => reel.destroy());
        this.reels = [];
        
        if (this.frameSpine) {
            this.frameSpine.destroy();
        }
        if (this.winAnimation) {
            this.winAnimation.destroy();
        }
        
        this.container.destroy();
    }
}
