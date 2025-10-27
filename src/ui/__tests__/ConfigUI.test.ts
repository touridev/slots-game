import { ConfigUI } from '../ConfigUI';
import * as PIXI from 'pixi.js';
import { configManager } from '../../core/ConfigManager';

// Mock configManager
jest.mock('../../core/ConfigManager', () => ({
    configManager: {
        get: jest.fn((key: string, subKey?: string) => {
            const config: any = {
                reels: {
                    count: 5,
                    symbolsPerReel: 8,
                    symbolSize: 130,
                    spinSpeed: 400
                },
                win: {
                    winChance: 0.3
                },
                animation: {
                    spinTotalDuration: 2000
                }
            };
            return subKey ? config[key][subKey] : config[key];
        }),
        set: jest.fn()
    }
}));

describe('ConfigUI', () => {
    let app: PIXI.Application;
    let configUI: ConfigUI;

    beforeEach(() => {
        jest.clearAllMocks();

        app = {
            screen: { width: 1280, height: 800 }
        } as PIXI.Application;

        configUI = new ConfigUI(app);
    });

    afterEach(() => {
        if (configUI) {
            configUI.destroy();
        }
    });

    describe('initialization', () => {
        it('creates config UI with container', () => {
            expect(configUI.container).toBeInstanceOf(PIXI.Container);
        });

        it('is hidden by default', () => {
            expect(configUI.container.visible).toBe(false);
        });

        it('creates config panel', () => {
            const panel = configUI.container.children.find(child => 
                child instanceof PIXI.Graphics
            );
            expect(panel).toBeDefined();
        });
    });

    describe('visibility', () => {
        it('shows when show is called', () => {
            configUI.show();
            expect(configUI.container.visible).toBe(true);
        });

        it('hides when hide is called', () => {
            configUI.show();
            configUI.hide();
            expect(configUI.container.visible).toBe(false);
        });

        it('toggles visibility', () => {
            expect(configUI.container.visible).toBe(false);
            
            configUI.toggle();
            expect(configUI.container.visible).toBe(true);
            
            configUI.toggle();
            expect(configUI.container.visible).toBe(false);
        });
    });

    describe('controls', () => {
        it('creates slider controls', () => {
            configUI.show();
            
            expect(configUI.container.children.length).toBeGreaterThan(0);
        });
    });

    describe('close button', () => {
        it('hides config when clicked', () => {
            configUI.show();
            expect(configUI.container.visible).toBe(true);
            
            const closeButton = configUI.container.children.find(child => 
                child instanceof PIXI.Graphics && child.interactive
            );
            
            if (closeButton) {
                (closeButton as any).emit('pointerdown');
                expect(configUI.container.visible).toBe(false);
            }
        });
    });

    describe('keyboard shortcuts', () => {
        it('hides on Escape key', () => {
            configUI.show();
            expect(configUI.container.visible).toBe(true);
            
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);
            
            expect(configUI.container.visible).toBe(false);
        });
    });

    describe('error handling', () => {
        it('handles missing config values', () => {
            (configManager.get as jest.Mock).mockReturnValue(undefined);
            
            expect(() => {
                const newConfigUI = new ConfigUI(app);
                newConfigUI.destroy();
            }).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('destroys container', () => {
            const destroySpy = jest.spyOn(configUI.container, 'destroy');
            
            configUI.destroy();
            
            expect(destroySpy).toHaveBeenCalled();
        });
    });
});
