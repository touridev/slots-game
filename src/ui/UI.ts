import * as PIXI from 'pixi.js';
import { SlotMachine } from '../slots/SlotMachine';
import { AssetLoader } from '../utils/AssetLoader';
import { sound } from '../utils/sound';
import { configManager } from '../core/ConfigManager';

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

    private createSpinButton(): void {
        try {
            const uiConfig = configManager.get('ui');
            const displayConfig = configManager.get('display');
            
            this.spinButton = new PIXI.Sprite(AssetLoader.getTexture('button_spin.png'));

            this.spinButton.anchor.set(0.5);
            this.spinButton.x = displayConfig.width / 2;
            this.spinButton.y = displayConfig.height - uiConfig.spinButtonOffsetFromBottom;
            this.spinButton.width = uiConfig.spinButtonWidth;
            this.spinButton.height = uiConfig.spinButtonHeight;

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

    private onSpinButtonClick(): void {
        sound.play('Spin button');
        
        this.spinButton.scale.set(0.95);
        setTimeout(() => {
            this.spinButton.scale.set(1.0);
        }, 100);

        this.slotMachine.spin();
    }

    private onButtonOver(event: PIXI.FederatedPointerEvent): void {
        const uiConfig = configManager.get('ui');
        (event.currentTarget as PIXI.Sprite).scale.set(uiConfig.buttonHoverScale);
    }

    private onButtonOut(event: PIXI.FederatedPointerEvent): void {
        (event.currentTarget as PIXI.Sprite).scale.set(1.0);
    }
}
