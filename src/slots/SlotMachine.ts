import * as PIXI from 'pixi.js';
import 'pixi-spine';
import { Reel } from './Reel';
import { sound } from '../utils/sound';
import { AssetLoader } from '../utils/AssetLoader';
import { REEL_CONFIG, ANIMATION_CONFIG, WIN_CONFIG } from '../utils/constants';
import {Spine} from "pixi-spine";

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

        // Center the slot machine
        this.container.x = this.app.screen.width / 2 - ((REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.SYMBOLS_PER_REEL) / 2);
        this.container.y = this.app.screen.height / 2 - ((REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.COUNT + REEL_CONFIG.REEL_SPACING * (REEL_CONFIG.COUNT - 1)) / 2);

        this.createBackground();

        this.createReels();

        this.initSpineAnimations();
    }

    private createBackground(): void {
        try {
            const background = new PIXI.Graphics();
            background.beginFill(0x000000, 0.5);
            background.drawRect(
                -20,
                -20,
                REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.SYMBOLS_PER_REEL + 40,
                REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.COUNT + REEL_CONFIG.REEL_SPACING * (REEL_CONFIG.COUNT - 1) + 40
            );
            background.endFill();
            this.container.addChild(background);
        } catch (error) {
            console.error('Error creating background:', error);
        }
    }

    private createReels(): void {
        // Create each reel
        for (let i = 0; i < REEL_CONFIG.COUNT; i++) {
            const reel = new Reel(REEL_CONFIG.SYMBOLS_PER_REEL, REEL_CONFIG.SYMBOL_SIZE);
            reel.container.y = i * (REEL_CONFIG.SYMBOL_SIZE + REEL_CONFIG.REEL_SPACING);
            this.container.addChild(reel.container);
            this.reels.push(reel);
        }
    }

    public update(delta: number): void {
        // Update each reel
        for (const reel of this.reels) {
            reel.update(delta);
        }
    }

    public spin(): void {
        if (this.isSpinning) return;

        this.isSpinning = true;

        // Play spin sound
        sound.play('Reel spin');

        // Disable spin button
        if (this.spinButton) {
            this.spinButton.texture = AssetLoader.getTexture('button_spin_disabled.png');
            this.spinButton.interactive = false;
        }

        // Start reels spinning with staggered delay
        for (let i = 0; i < this.reels.length; i++) {
            setTimeout(() => {
                this.reels[i].startSpin();
            }, i * ANIMATION_CONFIG.REEL_SPIN_DELAY);
        }

        // Stop all reels after a delay
        setTimeout(() => {
            this.stopSpin();
        }, ANIMATION_CONFIG.SPIN_TOTAL_DURATION + (this.reels.length - 1) * ANIMATION_CONFIG.REEL_SPIN_DELAY);
        
        // TODO: Add haptic feedback for mobile
        // TODO: Add visual effects for spin start
        
        // Track spin for analytics
        // analytics.trackSpin();
    }

    private stopSpin(): void {
        for (let i = 0; i < this.reels.length; i++) {
            setTimeout(() => {
                this.reels[i].stopSpin();

                // If this is the last reel, wait for all animations to complete
                if (i === this.reels.length - 1) {
                    // Check if all reels have finished by monitoring their animation state
                    const checkReelsComplete = () => {
                        const allComplete = this.reels.every(reel => reel.isAnimationComplete());
                        
                        if (allComplete) {
                            // All reels are done, now trigger win check immediately
                            this.checkWin();
                            this.isSpinning = false;

                            if (this.spinButton) {
                                this.spinButton.texture = AssetLoader.getTexture('button_spin.png');
                                this.spinButton.interactive = true;
                            }
                        } else {
                            // Some reels still animating, check again soon
                            setTimeout(checkReelsComplete, 50);
                        }
                    };
                    
                    // Start checking after a short delay
                    setTimeout(checkReelsComplete, 100);
                }
            }, i * ANIMATION_CONFIG.REEL_STOP_DELAY);
        }
    }

    private checkWin(): void {
        // Simple win check - just for demonstration
        const randomWin = Math.random() < WIN_CONFIG.WIN_CHANCE;

        if (randomWin) {
            sound.play('win');
            console.log('Winner! 🎉'); // Added emoji for fun

            if (this.winAnimation) {
                // Play the win animation found in "big-boom-h" spine
                this.winAnimation.visible = true;
                
                // Get available animations and play the first one, or a default if available
                const animationName = this.winAnimation.state.hasAnimation('animation') 
                    ? 'animation' 
                    : this.getFirstAnimationName(this.winAnimation);
                
                if (animationName) {
                    this.winAnimation.state.setAnimation(0, animationName, false);
                } else {
                    console.warn('No animations found in win animation spine');
                }
                
                // Hide animation after it finishes
                setTimeout(() => {
                    this.winAnimation!.visible = false;
                }, ANIMATION_CONFIG.WIN_ANIMATION_DURATION);
            }
            
            // Track win for analytics
            // analytics.trackWin();
        } else {
            // console.log('Better luck next time!'); // commented out for now
            // analytics.trackLoss();
        }
        
        // TODO: Add win streak tracking
        // TODO: Add different win types
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
            const frameSpineData = AssetLoader.getSpine('base-feature-frame.json');
            if (frameSpineData) {
                this.frameSpine = new Spine(frameSpineData.spineData);

                this.frameSpine.y = (REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.COUNT + REEL_CONFIG.REEL_SPACING * (REEL_CONFIG.COUNT - 1)) / 2;
                this.frameSpine.x = (REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.SYMBOLS_PER_REEL) / 2;

                if (this.frameSpine.state.hasAnimation('idle')) {
                    this.frameSpine.state.setAnimation(0, 'idle', true);
                }

                this.container.addChild(this.frameSpine);
            }

            const winSpineData = AssetLoader.getSpine('big-boom-h.json');
            if (winSpineData) {
                this.winAnimation = new Spine(winSpineData.spineData);

                this.winAnimation.x = (REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.COUNT + REEL_CONFIG.REEL_SPACING * (REEL_CONFIG.COUNT - 1)) / 2;
                this.winAnimation.y = (REEL_CONFIG.SYMBOL_SIZE * REEL_CONFIG.SYMBOLS_PER_REEL) / 2;

                this.winAnimation.visible = false;

                this.container.addChild(this.winAnimation);
            }
        } catch (error) {
            console.error('Error initializing spine animations:', error);
        }
    }
}
