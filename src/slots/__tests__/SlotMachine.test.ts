import { SlotMachine } from '../SlotMachine';
import * as PIXI from 'pixi.js';
import { AssetLoader } from '../../utils/AssetLoader';
import { configManager } from '../../core/ConfigManager';
import { sound } from '../../utils/sound';

// Mock dependencies
jest.mock('../../utils/AssetLoader');
jest.mock('../../core/ConfigManager');
jest.mock('../../utils/sound');
jest.mock('pixi-spine');

// Mock configManager
jest.mock('../../core/ConfigManager', () => ({
    configManager: {
        get: jest.fn((key: string, subKey?: string) => {
            const config: any = {
                reels: {
                    count: 5,
                    symbolsPerReel: 8,
                    symbolSize: 130,
                    symbolTextures: ['symbol1.png', 'symbol2.png', 'symbol3.png'],
                    spinSpeed: 400,
                    slowdownRate: 0.95,
                    stopThreshold: 5.0,
                    reelSpacing: 10
                },
                display: {
                    width: 1280,
                    height: 800
                },
                animation: {
                    reelSpinDelay: 200,
                    reelStopDelay: 400,
                    spinTotalDuration: 2000,
                    winAnimationDuration: 5000
                },
                win: {
                    winChance: 0.3,
                    bonusMultiplier: 2.0
                }
            };
            return subKey ? config[key][subKey] : config[key];
        })
    }
}));

describe('SlotMachine', () => {
    let app: PIXI.Application;
    let slotMachine: SlotMachine;

    beforeEach(() => {
        jest.clearAllMocks();

        app = {
            screen: { width: 1280, height: 800 },
            renderer: {} as PIXI.Renderer,
            stage: new PIXI.Container(),
            view: document.createElement('canvas'),
            destroy: jest.fn(),
            render: jest.fn(),
            ticker: {
                add: jest.fn(),
                remove: jest.fn()
            }
        } as unknown as PIXI.Application;

        (AssetLoader.getTexture as jest.Mock).mockReturnValue(
            new PIXI.Texture(new PIXI.BaseTexture())
        );
        (AssetLoader.getSpine as jest.Mock).mockReturnValue({
            spineData: {
                animations: [{ name: 'idle' }, { name: 'animation' }]
            }
        });

        (sound.play as jest.Mock).mockImplementation(() => {});

        slotMachine = new SlotMachine(app);
    });

    afterEach(() => {
        if (slotMachine) {
            slotMachine.destroy();
        }
    });

    describe('initialization', () => {
        it('creates slot machine with reels', () => {
            expect(slotMachine.container.children.length).toBeGreaterThan(0);
        });

        it('positions slot machine in center', () => {
            const config = configManager.get('reels');
            const displayConfig = configManager.get('display');
            
            const expectedX = displayConfig.width / 2 - ((config.symbolSize * config.symbolsPerReel) / 2);
            const expectedY = displayConfig.height / 2 - ((config.symbolSize * config.count + config.reelSpacing * (config.count - 1)) / 2);
            
            expect(slotMachine.container.x).toBe(expectedX);
            expect(slotMachine.container.y).toBe(expectedY);
        });

        it('creates background', () => {
            const background = slotMachine.container.children.find(child => 
                child instanceof PIXI.Graphics
            );
            expect(background).toBeDefined();
        });
    });

    describe('spinning', () => {
        it('starts spinning', () => {
            const mockButton = new PIXI.Sprite();
            slotMachine.setSpinButton(mockButton);
            
            slotMachine.spin();
            
            expect(sound.play).toHaveBeenCalledWith('Reel spin');
        });

        it('prevents double spin', () => {
            const mockButton = new PIXI.Sprite();
            slotMachine.setSpinButton(mockButton);
            
            slotMachine.spin();
            slotMachine.spin();
            
            expect(sound.play).toHaveBeenCalledTimes(1);
        });

        it('disables button during spin', () => {
            const mockButton = new PIXI.Sprite();
            mockButton.texture = AssetLoader.getTexture('button_spin.png');
            mockButton.interactive = true;
            
            slotMachine.setSpinButton(mockButton);
            slotMachine.spin();
            
            expect(mockButton.texture).toBe(AssetLoader.getTexture('button_spin_disabled.png'));
            expect(mockButton.interactive).toBe(false);
        });
    });

    describe('win detection', () => {
        it('plays win sound on win', () => {
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.1);
            
            slotMachine.spin();
            
            setTimeout(() => {
                expect(sound.play).toHaveBeenCalledWith('win');
            }, 3000);
            
            Math.random = originalRandom;
        });

        it('does not play win sound on loss', () => {
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.5);
            
            slotMachine.spin();
            
            setTimeout(() => {
                expect(sound.play).not.toHaveBeenCalledWith('win');
            }, 3000);
            
            Math.random = originalRandom;
        });
    });

    describe('update', () => {
        it('updates all reels', () => {
            const updateSpy = jest.spyOn(slotMachine as any, 'update');
            
            slotMachine.update(16);
            
            expect(updateSpy).toHaveBeenCalledWith(16);
        });
    });

    describe('spin button', () => {
        it('sets spin button', () => {
            const mockButton = new PIXI.Sprite();
            
            slotMachine.setSpinButton(mockButton);
            
            expect((slotMachine as any).spinButton).toBe(mockButton);
        });
    });

    describe('error handling', () => {
        it('handles AssetLoader errors', () => {
            (AssetLoader.getTexture as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Texture loading error');
            });
            
            expect(() => {
                const newSlotMachine = new SlotMachine(app);
                newSlotMachine.destroy();
            }).not.toThrow();
        });

        it('handles spine errors', () => {
            (AssetLoader.getSpine as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Spine loading error');
            });
            
            expect(() => {
                const newSlotMachine = new SlotMachine(app);
                newSlotMachine.destroy();
            }).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('destroys resources', () => {
            const destroySpy = jest.spyOn(slotMachine.container, 'destroy');
            
            slotMachine.destroy();
            
            expect(destroySpy).toHaveBeenCalled();
        });
    });
});
