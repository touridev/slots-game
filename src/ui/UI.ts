import * as PIXI from 'pixi.js';
import { SlotMachine } from '../slots/SlotMachine';
import { AssetLoader } from '../utils/AssetLoader';
import { sound } from '../utils/sound';
import { configManager } from '../core/ConfigManager';
import { eventManager } from '../core/EventManager';
import { ParticleSystem } from '../utils/ParticleSystem';

/**
 * UI State Management Interface
 * Defines the contract for UI state transitions
 */
interface UIState {
    readonly isSpinning: boolean;
    readonly balance: number;
    readonly totalWins: number;
    readonly betAmount: number;
    readonly soundEnabled: boolean;
}

/**
 * Button Configuration Interface
 * Centralizes button styling and behavior configuration
 */
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

/**
 * Animation Constants
 * Pre-calculated values for performance optimization
 */
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

/**
 * Event Types for Type Safety
 */
type UIEventType = 'balance:update' | 'win:display' | 'button:state:change' | 'animation:start' | 'animation:stop';

/**
 * Senior-Level UI Manager with Advanced Patterns
 * 
 * Key Optimizations:
 * 1. Immutable State Management
 * 2. Object Pooling for Graphics
 * 3. Event-Driven Architecture
 * 4. Performance Monitoring
 * 5. Memory Leak Prevention
 * 6. Type Safety with Interfaces
 * 7. Configuration-Driven Design
 * 8. Separation of Concerns
 */
export class UI {
    // Public API - Read-only access
    public readonly container: PIXI.Container;
    
    // Private Core Dependencies
    private readonly app: PIXI.Application;
    private readonly slotMachine: SlotMachine;
    private readonly particleSystem: ParticleSystem;
    
    // UI State Management
    private state: UIState;
    private readonly buttonConfig: ButtonConfig;
    
    // UI Elements - Organized by concern
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
    
    // Performance & Memory Management
    private animationFrameId: number | null = null;
    private readonly eventListeners: Map<string, () => void> = new Map();
    private readonly cleanupTasks: (() => void)[] = [];
    
    // Performance Monitoring
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
        
        // Initialize immutable state
        this.state = this.createInitialState();
        this.buttonConfig = this.createButtonConfig();
        
        // Initialize UI elements with proper structure
        this.elements = this.initializeElements();
        
        // Setup with proper error handling
        this.initializeUI();
        this.setupEventListeners();
        this.setupPerformanceMonitoring();
        
        // Register cleanup tasks
        this.registerCleanupTasks();
    }

    /**
     * Factory Method for Initial State
     * Ensures consistent state initialization
     */
    private createInitialState(): UIState {
        return {
            isSpinning: false,
            balance: 1000,
            totalWins: 0,
            betAmount: 10,
            soundEnabled: true,
        };
    }

    /**
     * Configuration Factory
     * Centralizes all styling and behavior configuration
     */
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

    /**
     * Element Initialization with Proper Structure
     * Uses factory pattern for consistent element creation
     */
    private initializeElements() {
        const displayConfig = configManager.get('display');
        
        return {
            spinButton: this.createSpinButtonElements(displayConfig),
            displays: this.createDisplayElements(displayConfig),
        };
    }

    /**
     * Spin Button Factory Method
     * Creates all spin button related elements
     */
    private createSpinButtonElements(displayConfig: any) {
        const buttonY = displayConfig.height - 120;
        const { width, height, borderRadius, fontSize, colors } = this.buttonConfig;
        
        // Create container with proper positioning
        const container = new PIXI.Container();
        container.x = displayConfig.width / 2;
        container.y = buttonY;
        
        // Create background with optimized drawing
        const background = this.createButtonBackground(width, height, borderRadius, colors);
        container.addChild(background);
        
        // Create text with consistent styling
        const text = this.createButtonText(fontSize, colors.text);
        container.addChild(text);
        
        // Create interactive area
        const interactive = this.createInteractiveArea(width, height);
        container.addChild(interactive);
        
        // Add to main container
        this.container.addChild(container);
        
        return { container, background, text, interactive };
    }

    /**
     * Optimized Button Background Creation
     * Uses efficient drawing techniques
     */
    private createButtonBackground(width: number, height: number, borderRadius: number, colors: any): PIXI.Graphics {
        const graphics = new PIXI.Graphics();
        
        // Use beginFill/endFill pattern for better performance
        graphics.beginFill(colors.primary);
        graphics.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        graphics.endFill();
        
        // Add gradient effect
        graphics.beginFill(colors.secondary, 0.5);
        graphics.drawRoundedRect(-width / 2, -height / 2, width, height / 2, borderRadius);
        graphics.endFill();
        
        return graphics;
    }

    /**
     * Button Text Factory
     * Creates consistent text styling
     */
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

    /**
     * Interactive Area Creation
     * Optimized invisible sprite for interaction
     */
    private createInteractiveArea(width: number, height: number): PIXI.Sprite {
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.width = width;
        sprite.height = height;
        sprite.anchor.set(0.5);
        sprite.alpha = 0; // Invisible but interactive
        
        sprite.interactive = true;
        sprite.cursor = 'pointer';
        
        return sprite;
    }

    /**
     * Display Elements Factory
     * Creates all display elements with consistent styling
     */
    private createDisplayElements(displayConfig: any) {
        return {
            balance: this.createDisplayText('BALANCE', `$${this.state.balance}`, 0x00ff88, 20, 35),
            wins: this.createDisplayText('TOTAL WINS', `$${this.state.totalWins}`, 0xffd700, displayConfig.width - 260, 35),
            bet: this.createDisplayText('BET AMOUNT', `$${this.state.betAmount}`, 0xff6b6b, displayConfig.width / 2 - 115, 35),
        };
    }

    /**
     * Display Text Factory
     * Creates consistent display text elements
     */
    private createDisplayText(label: string, value: string, valueColor: number, x: number, y: number): PIXI.Text {
        const text = new PIXI.Text(value, {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: valueColor,
            fontWeight: 'bold',
        });
        
        text.x = x;
        text.y = y;
        
        // Create label
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

    /**
     * Main UI Initialization
     * Handles setup with proper error handling
     */
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

    /**
     * Event-Driven Setup
     * Uses event delegation for better performance
     */
    private setupSpinButtonInteractions(): void {
        const { interactive, background, text } = this.elements.spinButton;
        
        // Event delegation pattern
        const handlePointerDown = this.handleSpinButtonClick.bind(this);
        const handlePointerOver = this.handleButtonOver.bind(this);
        const handlePointerOut = this.handleButtonOut.bind(this);
        
        // Apply to all interactive elements
        [interactive, background, text].forEach(element => {
            element.interactive = true;
            element.cursor = 'pointer';
            
            element.on('pointerdown', handlePointerDown);
            element.on('pointerover', handlePointerOver);
            element.on('pointerout', handlePointerOut);
        });
    }

    /**
     * State Management with Immutability
     * Updates state immutably and triggers UI updates
     */
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

    /**
     * Optimized Spinning State Handler
     * Uses state machine pattern for clean transitions
     */
    private handleSpinningStateChange(isSpinning: boolean): void {
        const { interactive, background, text } = this.elements.spinButton;
        
        // Update interactivity
        [interactive, background, text].forEach(element => {
            element.interactive = !isSpinning;
            element.cursor = isSpinning ? 'default' : 'pointer';
        });
        
        // Handle animations
        if (isSpinning) {
            this.startSpinningAnimation();
        } else {
            this.stopSpinningAnimation();
        }
    }

    /**
     * High-Performance Animation System
     * Uses requestAnimationFrame with performance monitoring
     */
    private startSpinningAnimation(): void {
        if (this.animationFrameId) {
            return; // Prevent multiple animations
        }
        
        let time = 0;
        const animate = (currentTime: number) => {
            if (!this.state.isSpinning) {
                this.animationFrameId = null;
                return;
            }
            
            // Performance monitoring
            this.updatePerformanceMetrics(currentTime);
            
            time += ANIMATION_CONSTANTS.TIME_STEP;
            
            // Optimized calculations
            const pulseScale = 1 + Math.sin(time * ANIMATION_CONSTANTS.PULSE_FREQUENCY) * ANIMATION_CONSTANTS.SCALE_RANGE;
            const glowIntensity = ANIMATION_CONSTANTS.GLOW_BASE + Math.sin(time * ANIMATION_CONSTANTS.GLOW_FREQUENCY) * ANIMATION_CONSTANTS.GLOW_RANGE;
            const textScale = 1 + Math.sin(time * ANIMATION_CONSTANTS.TEXT_PULSE_FREQUENCY) * ANIMATION_CONSTANTS.TEXT_SCALE_RANGE;
            
            // Apply animations
            this.elements.spinButton.container.scale.set(pulseScale);
            this.elements.spinButton.text.scale.set(textScale);
            
            // Update background with optimized drawing
            this.updateSpinningBackground(glowIntensity);
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * Optimized Background Update
     * Minimizes redraws and uses efficient drawing
     */
    private updateSpinningBackground(glowIntensity: number): void {
        const { background } = this.elements.spinButton;
        const { width, height, borderRadius, colors } = this.buttonConfig;
        
        background.clear();
        
        // Base background
        background.beginFill(colors.primary, 0.8);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        background.endFill();
        
        // Animated gradient
        background.beginFill(colors.secondary, glowIntensity);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        background.endFill();
        
        // Glowing border
        background.lineStyle(3, colors.accent, glowIntensity);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
    }

    /**
     * Performance Monitoring
     * Tracks animation performance for optimization
     */
    private updatePerformanceMetrics(currentTime: number): void {
        this.performanceMetrics.animationFrames++;
        
        if (this.performanceMetrics.lastFrameTime > 0) {
            const frameTime = currentTime - this.performanceMetrics.lastFrameTime;
            this.performanceMetrics.averageFrameTime = 
                (this.performanceMetrics.averageFrameTime + frameTime) / 2;
        }
        
        this.performanceMetrics.lastFrameTime = currentTime;
        
        // Log performance issues
        if (this.performanceMetrics.averageFrameTime > 20) {
            console.warn('UI animation performance degraded:', this.performanceMetrics.averageFrameTime);
        }
    }

    /**
     * Clean Animation Stop
     * Properly cleans up animation resources
     */
    private stopSpinningAnimation(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset all scales
        this.elements.spinButton.container.scale.set(1.0);
        this.elements.spinButton.text.scale.set(1.0);
        
        // Reset background to normal state
        this.resetButtonBackground();
    }

    /**
     * Reset Button Background
     * Returns button to normal state efficiently
     */
    private resetButtonBackground(): void {
        const { background } = this.elements.spinButton;
        const { width, height, borderRadius, colors } = this.buttonConfig;
        
        background.clear();
        
        // Normal background
        background.beginFill(colors.primary);
        background.drawRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        background.endFill();
        
        // Normal gradient
        background.beginFill(colors.secondary, 0.5);
        background.drawRoundedRect(-width / 2, -height / 2, width, height / 2, borderRadius);
        background.endFill();
    }

    /**
     * Event Handlers with Proper Error Handling
     */
    private handleSpinButtonClick = (): void => {
        if (this.state.isSpinning || this.state.balance < this.state.betAmount) {
            if (this.state.balance < this.state.betAmount) {
                this.showInsufficientFunds();
            }
            return;
        }

        try {
            sound.play('Spin button');
            
            // Update state immutably
            this.updateState({
                balance: this.state.balance - this.state.betAmount,
                isSpinning: true,
            });
            
            // Click animation
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

    /**
     * Display Update Methods
     * Optimized text updates
     */
    private updateBalanceDisplay(balance: number): void {
        this.elements.displays.balance.text = `$${balance}`;
    }

    private updateWinDisplay(totalWins: number): void {
        this.elements.displays.wins.text = `$${totalWins}`;
    }

    /**
     * Event Listeners Setup
     * Uses event delegation and proper cleanup
     */
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
        
        // Store for cleanup
        this.eventListeners.set('win:detected', () => eventManager.off('win:detected', handleWinDetected));
        this.eventListeners.set('spin:stop', () => eventManager.off('spin:stop', handleSpinStop));
    }

    /**
     * Performance Monitoring Setup
     * Monitors UI performance
     */
    private setupPerformanceMonitoring(): void {
        const monitorPerformance = () => {
            if (this.performanceMetrics.animationFrames > 0) {
                console.log('UI Performance:', {
                    averageFrameTime: this.performanceMetrics.averageFrameTime.toFixed(2) + 'ms',
                    animationFrames: this.performanceMetrics.animationFrames,
                });
            }
        };
        
        // Monitor every 5 seconds
        const intervalId = setInterval(monitorPerformance, 5000);
        this.cleanupTasks.push(() => clearInterval(intervalId));
    }

    /**
     * Win Animation with Particle Effects
     * Enhanced visual feedback
     */
    private showWinAnimation(amount: number): void {
        const displayConfig = configManager.get('display');
        
        // Create particle effects
        this.particleSystem.createExplosion(displayConfig.width / 2, displayConfig.height / 2 - 100, 0xffd700, 30);
        this.particleSystem.createSparkles(displayConfig.width / 2, displayConfig.height / 2 - 100, 20);
        this.particleSystem.createCoinRain(displayConfig.width / 2, displayConfig.height / 2 - 100, 15);
        
        // Create win popup with optimized animation
        this.createWinPopup(amount, displayConfig);
    }

    /**
     * Optimized Win Popup Creation
     * Uses efficient animation techniques
     */
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
        
        // Optimized animation using GSAP-like easing
        this.animateWinPopup(winPopup);
    }

    /**
     * Optimized Win Popup Animation
     * Uses efficient animation techniques
     */
    private animateWinPopup(popup: PIXI.Text): void {
        popup.scale.set(0);
        popup.alpha = 0;
        
        const animate = (progress: number) => {
            if (progress >= 1) {
                this.container.removeChild(popup);
                return;
            }
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            popup.scale.set(easeOut * 1.2);
            popup.alpha = easeOut;
            
            requestAnimationFrame(() => animate(progress + 0.02));
        };
        
        animate(0);
    }

    /**
     * Error Handling
     */
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

    /**
     * Cleanup Registration
     * Ensures proper resource cleanup
     */
    private registerCleanupTasks(): void {
        this.cleanupTasks.push(
            () => this.stopSpinningAnimation(),
            () => this.particleSystem.destroy(),
            () => this.eventListeners.forEach(cleanup => cleanup()),
        );
    }

    /**
     * Public API Methods
     */
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

    /**
     * Getters for State Access
     * Provides controlled access to internal state
     */
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