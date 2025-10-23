import * as PIXI from 'pixi.js';
import { SlotMachine } from '../slots/SlotMachine';
import { AssetLoader } from '../utils/AssetLoader';
import { sound } from '../utils/sound';
import { UI_CONFIG, GAME_CONFIG } from '../utils/constants';

/**
 * UI class that manages user interface elements like the spin button
 */
export class UI {
    public container: PIXI.Container;
    private app: PIXI.Application;
    private slotMachine: SlotMachine;
    private spinButton!: PIXI.Sprite;

    constructor(app: PIXI.Application, slotMachine: SlotMachine) {
        this.app = app;
        this.slotMachine = slotMachine;
        this.container = new PIXI.Container();

        this.createSpinButton();
    }

    /**
     * Creates and configures the spin button
     */
    private createSpinButton(): void {
        try {
            this.spinButton = new PIXI.Sprite(AssetLoader.getTexture('button_spin.png'));

            this.spinButton.anchor.set(0.5);
            this.spinButton.x = this.app.screen.width / 2;
            this.spinButton.y = this.app.screen.height - UI_CONFIG.SPIN_BUTTON_OFFSET_FROM_BOTTOM;
            this.spinButton.width = UI_CONFIG.SPIN_BUTTON_WIDTH;
            this.spinButton.height = UI_CONFIG.SPIN_BUTTON_HEIGHT;

            this.spinButton.interactive = true;
            this.spinButton.cursor = 'pointer';

            this.spinButton.on('pointerdown', this.onSpinButtonClick.bind(this));
            this.spinButton.on('pointerover', this.onButtonOver.bind(this));
            this.spinButton.on('pointerout', this.onButtonOut.bind(this));

            this.container.addChild(this.spinButton);

            this.slotMachine.setSpinButton(this.spinButton);
        } catch (error) {
            console.error('Error creating spin button:', error);
        }
    }

    /**
     * Handles spin button click event
     */
    private onSpinButtonClick(): void {
        sound.play('Spin button');

        this.slotMachine.spin();
    }

    /**
     * Handles spin button hover over event
     */
    private onButtonOver(event: PIXI.FederatedPointerEvent): void {
        (event.currentTarget as PIXI.Sprite).scale.set(UI_CONFIG.BUTTON_HOVER_SCALE);
    }

    /**
     * Handles spin button hover out event
     */
    private onButtonOut(event: PIXI.FederatedPointerEvent): void {
        (event.currentTarget as PIXI.Sprite).scale.set(1.0);
    }
}
