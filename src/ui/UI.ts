import * as PIXI from 'pixi.js';
import { SlotMachine } from '../slots/SlotMachine';
import { AssetLoader } from '../utils/AssetLoader';
import { sound } from '../utils/sound';
import { configManager } from '../core/ConfigManager';
import { eventManager } from '../core/EventManager';
import { ParticleSystem } from '../utils/ParticleSystem';

interface UIState {
    readonly isSpinning: boolean;
    readonly balance: number;
    readonly totalWins: number;
    readonly betAmount: number;
    readonly soundEnabled: boolean;
}

interface ButtonConfig {
    readonly width: number;
    readonly height: number;
    readonly borderRadius: number;
    readonly fontSize: number;
    readonly colors: {
        readonly primary: number;
        readonly secondary: number;
        readonly accent: number;
        readonly text: number;
        readonly disabled: number;
    };
    readonly animations: {
        readonly hoverScale: number;
        readonly clickScale: number;
        readonly pulseIntensity: number;
        readonly glowIntensity: number;
    };
}

const ANIMATION_CONSTANTS = {
    PULSE_FREQUENCY: 3,
    GLOW_FREQUENCY: 2,
    TEXT_PULSE_FREQUENCY: 4,
    TIME_STEP: 0.1,
    SCALE_RANGE: 0.05,
    TEXT_SCALE_RANGE: 0.02,
    GLOW_RANGE: 0.3,
    GLOW_BASE: 0.5,
} as const;

type UIEventType = 'balance:update' | 'win:display' | 'button:state:change' | 'animation:start' | 'animation:stop';

export class UI {
    public readonly container: PIXI.Container;

    private readonly app: PIXI.Application;
    private readonly slotMachine: SlotMachine;
    private readonly particleSystem: ParticleSystem;

    private state: UIState;
    private readonly buttonConfig: ButtonConfig;

    private readonly elements: {
        spinButton: {
            container: PIXI.Container;
            background: PIXI.Graphics;
            text: PIXI.Text;
            interactive: PIXI.Sprite;
        };
        displays: {
            balance: PIXI.Text;
            wins: PIXI.Text;
            bet: PIXI.Text;
        };
    };

    private animationFrameId: number | null = null;
    private readonly eventListeners: Map<string, () => void> = new Map();
    private readonly cleanupTasks: (() => void)[] = [];

    private readonly performanceMetrics = {
        animationFrames: 0,
        lastFrameTime: 0,
        averageFrameTime: 0,
    };

    constructor(app: PIXI.Application, slotMachine: SlotMachine) {
        this.app = app;
        this.slotMachine = slotMachine;
        this.container = new PIXI.Container();
        this.particleSystem = new ParticleSystem();

        this.state = this.createInitialState();
        this.buttonConfig = this.createButtonConfig();

        this.elements = this.initializeElements();

        this.initializeUI();
        this.setupEventListeners();
        this.setupPerformanceMonitoring();

        this.registerCleanupTasks();
    }

    private createInitialState(): UIState {
        return {
            isSpinning: false,
            balance: 1000,
            totalWins: 0,
            betAmount: 10,
            soundEnabled: true,
        };
    }

    private createButtonConfig(): ButtonConfig {
        const displayConfig = configManager.get('display');

        return {
            width: 200,
            height: 100,
            borderRadius: 20,
            fontSize: 36,
            colors: {
                primary: 0x4a90e2,
                secondary: 0x357abd,
                accent: 0x00ff88,
                text: 0xffffff,
                disabled: 0x666666,
            },
            animations: {
                hoverScale: configManager.get('ui', 'buttonHoverScale'),
                clickScale: 0.95,
                pulseIntensity: 0.8,
                glowIntensity: 0.6,
            },
        };
    }

    private initializeElements() {
        const displayConfig = configManager.get('display');

        return {
            spinButton: this.createSpinButtonElements(displayConfig),
            displays: this.createDisplayElements(displayConfig),
        };
    }

    private createSpinButtonElements(displayConfig: any) {
        const buttonY = displayConfig.height - 120;
        const { width, height, borderRadius, fontSize, colors } = this.buttonConfig;

        const container = new PIXI.Container();
        container.x = displayConfig.width / 2;
        container.y = buttonY;

        const background = this.createButtonBackground(width, height, borderRadius, colors);
        container.addChild(background);

        const text = this.createButtonText(fontSize, colors.text);
        container.addChild(text);

        const interactive = this.createInteractiveArea(width, height);
        container.addChild(interactive);

        this.container.addChild(container);

        return { container, background, text, interactive };
    }

    private createButtonBackground(width: number, height: number, borderRadius: number, colors: any): PIXI.Graphics {
        const graphics = new PIXI.Graphics();

        graphics.beginFill(colors.primary);
        graphics.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        graphics.endFill();

        graphics.beginFill(colors.secondary, 0.5);
        graphics.drawRoundedRect(-width / 2, -height / 2, width, height / 2, borderRadius);
        graphics.endFill();

        return graphics;
    }

    private createButtonText(fontSize: number, color: number): PIXI.Text {
        const text = new PIXI.Text('SPIN', {
            fontFamily: 'Arial',
            fontSize,
            fill: color,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3,
        });

        text.anchor.set(0.5);
        return text;
    }

    private createInteractiveArea(width: number, height: number): PIXI.Sprite {
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.width = width;
        sprite.height = height;
        sprite.anchor.set(0.5);
        sprite.alpha = 0;

        sprite.interactive = true;
        sprite.cursor = 'pointer';

        return sprite;
    }

    private createDisplayElements(displayConfig: any) {
        return {
            balance: this.createDisplayText('BALANCE', `$${this.state.balance}`, 0x00ff88, 20, 35),
            wins: this.createDisplayText('TOTAL WINS', `$${this.state.totalWins}`, 0xffd700, displayConfig.width - 260, 35),
            bet: this.createDisplayText('BET AMOUNT', `$${this.state.betAmount}`, 0xff6b6b, displayConfig.width / 2 - 115, 35),
        };
    }

    private createDisplayText(label: string, value: string, valueColor: number, x: number, y: number): PIXI.Text {
        const text = new PIXI.Text(value, {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: valueColor,
            fontWeight: 'bold',
        });
        
        text.x = x;
        text.y = y;

        const labelText = new PIXI.Text(label, {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: 'bold',
        });

        labelText.x = x;
        labelText.y = y - 20;

        this.container.addChild(labelText);
        this.container.addChild(text);

        return text;
    }

    private initializeUI(): void {
        try {
            this.container.addChild(this.particleSystem.getContainer());
            this.setupSpinButtonInteractions();
            this.slotMachine.setSpinButton(this.elements.spinButton.interactive);
        } catch (error) {
            console.error('UI initialization failed:', error);
            eventManager.emit('error:occurred', {
                error: error as Error,
                context: 'UI initialization'
            });
        }
    }

    private setupSpinButtonInteractions(): void {
        const { interactive, background, text } = this.elements.spinButton;

        const handlePointerDown = this.handleSpinButtonClick.bind(this);
        const handlePointerOver = this.handleButtonOver.bind(this);
        const handlePointerOut = this.handleButtonOut.bind(this);

        [interactive, background, text].forEach(element => {
            element.interactive = true;
            element.cursor = 'pointer';

            element.on('pointerdown', handlePointerDown);
            element.on('pointerover', handlePointerOver);
            element.on('pointerout', handlePointerOut);
        });
    }

    private updateState(updates: Partial<UIState>): void {
        const newState = { ...this.state, ...updates };

        if (this.state.isSpinning !== newState.isSpinning) {
            this.handleSpinningStateChange(newState.isSpinning);
        }

        if (this.state.balance !== newState.balance) {
            this.updateBalanceDisplay(newState.balance);
        }

        if (this.state.totalWins !== newState.totalWins) {
            this.updateWinDisplay(newState.totalWins);
        }

        this.state = newState;
    }

    private handleSpinningStateChange(isSpinning: boolean): void {
        const { interactive, background, text } = this.elements.spinButton;

        [interactive, background, text].forEach(element => {
            element.interactive = !isSpinning;
            element.cursor = isSpinning ? 'default' : 'pointer';
        });

        if (isSpinning) {
            this.startSpinningAnimation();
        } else {
            this.stopSpinningAnimation();
        }
    }

    private startSpinningAnimation(): void {
        if (this.animationFrameId) {
            return;
        }

        let time = 0;
        const animate = (currentTime: number) => {
            if (!this.state.isSpinning) {
                this.animationFrameId = null;
                return;
            }

            this.updatePerformanceMetrics(currentTime);

            time += ANIMATION_CONSTANTS.TIME_STEP;

            const pulseScale = 1 + Math.sin(time * ANIMATION_CONSTANTS.PULSE_FREQUENCY) * ANIMATION_CONSTANTS.SCALE_RANGE;
            const glowIntensity = ANIMATION_CONSTANTS.GLOW_BASE + Math.sin(time * ANIMATION_CONSTANTS.GLOW_FREQUENCY) * ANIMATION_CONSTANTS.GLOW_RANGE;
            const textScale = 1 + Math.sin(time * ANIMATION_CONSTANTS.TEXT_PULSE_FREQUENCY) * ANIMATION_CONSTANTS.TEXT_SCALE_RANGE;

            this.elements.spinButton.container.scale.set(pulseScale);
            this.elements.spinButton.text.scale.set(textScale);

            this.updateSpinningBackground(glowIntensity);

            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    private updateSpinningBackground(glowIntensity: number): void {
        const { background } = this.elements.spinButton;
        const { width, height, borderRadius, colors } = this.buttonConfig;

        background.clear();

        background.beginFill(colors.primary, 0.8);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        background.endFill();

        background.beginFill(colors.secondary, glowIntensity);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        background.endFill();

        background.lineStyle(3, colors.accent, glowIntensity);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
    }

    private updatePerformanceMetrics(currentTime: number): void {
        this.performanceMetrics.animationFrames++;

        if (this.performanceMetrics.lastFrameTime > 0) {
            const frameTime = currentTime - this.performanceMetrics.lastFrameTime;
            this.performanceMetrics.averageFrameTime =
                (this.performanceMetrics.averageFrameTime + frameTime) / 2;
        }

        this.performanceMetrics.lastFrameTime = currentTime;

        if (this.performanceMetrics.averageFrameTime > 20) {
            console.warn('UI animation performance degraded:', this.performanceMetrics.averageFrameTime);
        }
    }

    private stopSpinningAnimation(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.elements.spinButton.container.scale.set(1.0);
        this.elements.spinButton.text.scale.set(1.0);

        this.resetButtonBackground();
    }

    private resetButtonBackground(): void {
        const { background } = this.elements.spinButton;
        const { width, height, borderRadius, colors } = this.buttonConfig;

        background.clear();

        background.beginFill(colors.primary);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        background.endFill();

        background.beginFill(colors.secondary, 0.5);
        background.drawRoundedRect(-width / 2, -height / 2, width, height / 2, borderRadius);
        background.endFill();
    }

    private handleSpinButtonClick = (): void => {
        if (this.state.isSpinning || this.state.balance < this.state.betAmount) {
            if (this.state.balance < this.state.betAmount) {
                this.showInsufficientFunds();
            }
            return;
        }

        try {
            sound.play('Spin button');

            this.updateState({
                balance: this.state.balance - this.state.betAmount,
                isSpinning: true,
            });

            this.elements.spinButton.container.scale.set(this.buttonConfig.animations.clickScale);
            setTimeout(() => {
                this.elements.spinButton.container.scale.set(1.0);
            }, 100);

            this.slotMachine.spin();
        } catch (error) {
            console.error('Spin button click failed:', error);
        }
    };

    private handleButtonOver = (): void => {
        if (this.state.isSpinning) return;

        this.elements.spinButton.container.scale.set(this.buttonConfig.animations.hoverScale);
    };

    private handleButtonOut = (): void => {
        if (this.state.isSpinning) return;

        this.elements.spinButton.container.scale.set(1.0);
    };

    private updateBalanceDisplay(balance: number): void {
        this.elements.displays.balance.text = `$${balance}`;
    }

    private updateWinDisplay(totalWins: number): void {
        this.elements.displays.wins.text = `$${totalWins}`;
    }

    private setupEventListeners(): void {
        const handleWinDetected = (data: any) => {
            const winAmount = this.state.betAmount * data.multiplier;
            this.updateState({
                totalWins: this.state.totalWins + winAmount,
                balance: this.state.balance + winAmount,
            });
            this.showWinAnimation(winAmount);
        };
        
        const handleSpinStop = () => {
            this.updateState({ isSpinning: false });
        };

        eventManager.on('win:detected', handleWinDetected);
        eventManager.on('spin:stop', handleSpinStop);

        this.eventListeners.set('win:detected', () => eventManager.off('win:detected', handleWinDetected));
        this.eventListeners.set('spin:stop', () => eventManager.off('spin:stop', handleSpinStop));
    }

    private setupPerformanceMonitoring(): void {
        const monitorPerformance = () => {
            if (this.performanceMetrics.animationFrames > 0) {
                console.log('UI Performance:', {
                    averageFrameTime: this.performanceMetrics.averageFrameTime.toFixed(2) + 'ms',
                    animationFrames: this.performanceMetrics.animationFrames,
                });
            }
        };

        const intervalId = setInterval(monitorPerformance, 5000);
        this.cleanupTasks.push(() => clearInterval(intervalId));
    }

    private showWinAnimation(amount: number): void {
        const displayConfig = configManager.get('display');

        this.particleSystem.createExplosion(displayConfig.width / 2, displayConfig.height / 2 - 100, 0xffd700, 30);
        this.particleSystem.createSparkles(displayConfig.width / 2, displayConfig.height / 2 - 100, 20);
        this.particleSystem.createCoinRain(displayConfig.width / 2, displayConfig.height / 2 - 100, 15);

        this.createWinPopup(amount, displayConfig);
    }

    private createWinPopup(amount: number, displayConfig: any): void {
        const winPopup = new PIXI.Text(`+$${amount}`, {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xffd700,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3,
        });

        winPopup.anchor.set(0.5);
        winPopup.x = displayConfig.width / 2;
        winPopup.y = displayConfig.height / 2 - 100;

        this.container.addChild(winPopup);

        this.animateWinPopup(winPopup);
    }

    private animateWinPopup(popup: PIXI.Text): void {
        popup.scale.set(0);
        popup.alpha = 0;

        const animate = (progress: number) => {
            if (progress >= 1) {
                this.container.removeChild(popup);
                return;
            }

            const easeOut = 1 - Math.pow(1 - progress, 3);

            popup.scale.set(easeOut * 1.2);
            popup.alpha = easeOut;

            requestAnimationFrame(() => animate(progress + 0.02));
        };

        animate(0);
    }

    private showInsufficientFunds(): void {
        const displayConfig = configManager.get('display');

        const errorText = new PIXI.Text('INSUFFICIENT FUNDS', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xff0000,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 2,
        });

        errorText.anchor.set(0.5);
        errorText.x = displayConfig.width / 2;
        errorText.y = displayConfig.height / 2 + 100;

        this.container.addChild(errorText);

        setTimeout(() => {
            this.container.removeChild(errorText);
        }, 2000);
    }

    private registerCleanupTasks(): void {
        this.cleanupTasks.push(
            () => this.stopSpinningAnimation(),
            () => this.particleSystem.destroy(),
            () => this.eventListeners.forEach(cleanup => cleanup()),
        );
    }

    public update(delta: number): void {
        this.particleSystem.update(delta);
    }

    public destroy(): void {
        this.cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                console.error('Cleanup task failed:', error);
            }
        });
        
        this.container.destroy();
    }

    public get isSpinning(): boolean {
        return this.state.isSpinning;
    }

    public get balance(): number {
        return this.state.balance;
    }

    public get totalWins(): number {
        return this.state.totalWins;
    }

    public get betAmount(): number {
        return this.state.betAmount;
    }
}