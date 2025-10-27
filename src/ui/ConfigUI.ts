import * as PIXI from 'pixi.js';
import { configManager, GameConfig } from '../core/ConfigManager';

export class ConfigUI {
    public container: PIXI.Container;
    private visible: boolean = false;
    private panel: PIXI.Graphics | null = null;
    private sliders: Map<string, PIXI.Graphics> = new Map();
    private app: PIXI.Application;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.container = new PIXI.Container();
        this.container.visible = false;
        
        this.buildPanel();
        this.addKeyboardHandlers();
    }

    private buildPanel(): void {
        this.panel = new PIXI.Graphics();
        this.panel.beginFill(0x1a1a2e, 0.95);
        this.panel.drawRoundedRect(0, 0, 400, 600, 10);
        this.panel.endFill();
        
        this.panel.lineStyle(2, 0x4a90e2, 0.8);
        this.panel.drawRoundedRect(0, 0, 400, 600, 10);
        
        this.panel.x = (this.app.screen.width - 400) / 2;
        this.panel.y = (this.app.screen.height - 600) / 2;
        
        this.container.addChild(this.panel);
        
        this.addControls();
    }

    private addControls(): void {
        if (!this.panel) return;

        let y = 50;
        const spacing = 60;

        this.addSlider('Reel Count', 'reels', 'count', 1, 10, 5, 20, y);
        y += spacing;

        this.addSlider('Symbols Per Reel', 'reels', 'symbolsPerReel', 3, 15, 8, 20, y);
        y += spacing;

        this.addSlider('Symbol Size', 'reels', 'symbolSize', 80, 200, 130, 20, y);
        y += spacing;

        this.addSlider('Spin Speed', 'reels', 'spinSpeed', 100, 800, 400, 20, y);
        y += spacing;

        this.addSlider('Win Chance', 'win', 'winChance', 0.1, 0.9, 0.3, 20, y);
        y += spacing;

        this.addSlider('Spin Duration (ms)', 'animation', 'spinTotalDuration', 1000, 5000, 2000, 20, y);
        y += spacing;

        const titleStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0x4a90e2,
            fontWeight: 'bold'
        });
        
        const title = new PIXI.Text('Game Configuration', titleStyle);
        title.x = 20;
        title.y = 10;
        this.panel.addChild(title);

        this.addCloseBtn();
    }

    private addSlider(
        label: string, 
        section: keyof GameConfig, 
        key: string, 
        min: number, 
        max: number, 
        defaultVal: number,
        x: number, 
        y: number
    ): void {
        if (!this.panel) return;

        const labelStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });
        
        const labelText = new PIXI.Text(label, labelStyle);
        labelText.x = x;
        labelText.y = y;
        this.panel.addChild(labelText);

        const valueStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4a90e2
        });
        
        const currentVal = (configManager as any).get(section, key) || defaultVal;
        const valueText = new PIXI.Text(String(currentVal), valueStyle);
        valueText.x = x + 200;
        valueText.y = y;
        this.panel.addChild(valueText);

        const track = new PIXI.Graphics();
        track.beginFill(0x333333);
        track.drawRect(x, y + 20, 150, 8);
        track.endFill();
        this.panel.addChild(track);

        const handle = new PIXI.Graphics();
        handle.beginFill(0x4a90e2);
        handle.drawCircle(0, 0, 8);
        handle.endFill();
        
        const normalizedVal = (currentVal - min) / (max - min);
        handle.x = x + normalizedVal * 150;
        handle.y = y + 24;
        
        handle.interactive = true;
        (handle as any).buttonMode = true;
        
        this.sliders.set(`${section}.${key}`, handle);
        
        let dragging = false;
        
        handle.on('pointerdown', () => {
            dragging = true;
        });
        
        handle.on('pointermove', (event) => {
            if (dragging && this.panel) {
                const pos = event.data.getLocalPosition(this.panel);
                const newX = Math.max(x, Math.min(x + 150, pos.x));
                handle.x = newX;
                
                const normalizedPos = (newX - x) / 150;
                const newVal = min + normalizedPos * (max - min);
                const roundedVal = Math.round(newVal * 100) / 100;
                
                (configManager as any).set(section, key, roundedVal);
                valueText.text = String(roundedVal);
            }
        });
        
        handle.on('pointerup', () => {
            dragging = false;
        });
        
        handle.on('pointerupoutside', () => {
            dragging = false;
        });
        
        this.panel.addChild(handle);
    }

    private addCloseBtn(): void {
        if (!this.panel) return;

        const closeBtn = new PIXI.Graphics();
        closeBtn.beginFill(0xff4444);
        closeBtn.drawCircle(0, 0, 15);
        closeBtn.endFill();
        
        closeBtn.x = 370;
        closeBtn.y = 20;
        
        closeBtn.interactive = true;
        (closeBtn as any).buttonMode = true;
        
        closeBtn.on('pointerdown', () => {
            this.hide();
        });
        
        this.panel.addChild(closeBtn);
        
        const xStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        
        const xText = new PIXI.Text('×', xStyle);
        xText.anchor.set(0.5);
        xText.x = 370;
        xText.y = 20;
        this.panel.addChild(xText);
    }

    private addKeyboardHandlers(): void {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.visible) {
                this.hide();
            }
        });
    }

    public show(): void {
        this.visible = true;
        this.container.visible = true;
    }

    public hide(): void {
        this.visible = false;
        this.container.visible = false;
    }

    public toggle(): void {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public destroy(): void {
        this.container.destroy();
    }
}
