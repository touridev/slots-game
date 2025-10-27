import { Reel } from '../Reel';
import * as PIXI from 'pixi.js';
import { AssetLoader } from '../../utils/AssetLoader';
import { configManager } from '../../core/ConfigManager';

// Mock AssetLoader
jest.mock('../../utils/AssetLoader');

// Mock configManager
jest.mock('../../core/ConfigManager', () => ({
    configManager: {
        get: jest.fn((key: string, subKey?: string) => {
            const config: any = {
                reels: {
                    symbolTextures: ['symbol1.png', 'symbol2.png', 'symbol3.png'],
                    spinSpeed: 400,
                    slowdownRate: 0.95,
                    stopThreshold: 5.0
                },
                performance: {
                    enableObjectPooling: false
                }
            };
            return subKey ? config[key][subKey] : config[key];
        })
    }
}));

describe('Reel', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock AssetLoader.getTexture to return a mock texture
        (AssetLoader.getTexture as jest.Mock).mockReturnValue(
            new PIXI.Texture(new PIXI.BaseTexture())
        );
    });

    describe('edge cases', () => {
        it('handles zero symbols', () => {
            const reel = new Reel(0, 150, 0);
            expect(reel.children.length).toBe(0);
        });

        it('handles single symbol', () => {
            const reel = new Reel(1, 150, 0);
            expect(reel.children.length).toBe(1);
            
            const symbol = reel.children[0] as PIXI.Sprite;
            expect(symbol.x).toBe(0);
            expect(symbol.width).toBe(150);
        });

        it('handles many symbols', () => {
            const reel = new Reel(100, 150, 0);
            expect(reel.children.length).toBe(100);
            
            for (let i = 0; i < 100; i++) {
                const symbol = reel.children[i] as PIXI.Sprite;
                expect(symbol.x).toBe(i * 150);
            }
        });

        it('handles rapid start/stop', () => {
            const reel = new Reel(6, 150, 0);
            
            for (let i = 0; i < 10; i++) {
                reel.startSpin();
                reel.stopSpin();
            }
            
            expect(reel.children.length).toBe(6);
        });

        it('handles zero delta', () => {
            const reel = new Reel(6, 150, 0);
            const initialX = (reel.children[0] as PIXI.Sprite).x;
            
            reel.update(0);
            
            expect((reel.children[0] as PIXI.Sprite).x).toBe(initialX);
        });

        it('handles negative delta', () => {
            const reel = new Reel(6, 150, 0);
            reel.startSpin();
            
            reel.update(-16);
            
            expect(reel.children.length).toBe(6);
        });

        it('handles large delta', () => {
            const reel = new Reel(6, 150, 0);
            reel.startSpin();
            
            reel.update(10000);
            
            expect(reel.children.length).toBe(6);
        });

        it('maintains visibility during spin', () => {
            const reel = new Reel(6, 150, 0);
            reel.startSpin();
            
            for (let i = 0; i < 50; i++) {
                reel.update(16);
            }
            
            for (let i = 0; i < 6; i++) {
                const symbol = reel.children[i] as PIXI.Sprite;
                expect(symbol.visible).toBe(true);
            }
        });
    });

    describe('performance', () => {
        it('handles 1000 symbols', () => {
            const startTime = performance.now();
            const reel = new Reel(1000, 150, 0);
            const creationTime = performance.now() - startTime;
            
            expect(reel.children.length).toBe(1000);
            expect(creationTime).toBeLessThan(1000);
        });

        it('updates 1000 symbols efficiently', () => {
            const reel = new Reel(1000, 150, 0);
            reel.startSpin();
            
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                reel.update(16);
            }
            
            const updateTime = performance.now() - startTime;
            
            expect(updateTime).toBeLessThan(100);
            expect(reel.children.length).toBe(1000);
        });

        it('handles memory efficiently', () => {
            const reels: Reel[] = [];
            
            for (let i = 0; i < 10; i++) {
                const reel = new Reel(100, 150, i);
                reels.push(reel);
            }
            
            expect(reels.length).toBe(10);
            expect(reels[0].children.length).toBe(100);
            
            reels.forEach(reel => reel.destroy());
        });

        it('maintains smooth animation', () => {
            const reel = new Reel(500, 150, 0);
            reel.startSpin();
            
            let lastX = (reel.children[0] as PIXI.Sprite).x;
            let smooth = true;
            
            for (let i = 0; i < 50; i++) {
                reel.update(16);
                const currentX = (reel.children[0] as PIXI.Sprite).x;
                
                const deltaX = Math.abs(currentX - lastX);
                if (deltaX > 1000) {
                    smooth = false;
                    break;
                }
                
                lastX = currentX;
            }
            
            expect(smooth).toBe(true);
        });
    });

    describe('constructor and symbol creation', () => {
        it('should create a reel with the correct number of symbols', () => {
            const symbolCount = 6;
            const symbolSize = 150;
            const reel = new Reel(symbolCount, symbolSize, 0);

            expect(reel.children.length).toBe(symbolCount);
        });

        it('should initialize symbols with correct size', () => {
            const symbolSize = 150;
            const reel = new Reel(6, symbolSize, 0);

            // Check first symbol dimensions
            const firstSymbol = reel.children[0] as PIXI.Sprite;
            expect(firstSymbol.width).toBe(symbolSize);
            expect(firstSymbol.height).toBe(symbolSize);
        });

        it('should position symbols horizontally', () => {
            const symbolSize = 150;
            const reel = new Reel(6, symbolSize, 0);

            for (let i = 0; i < 6; i++) {
                const symbol = reel.children[i] as PIXI.Sprite;
                expect(symbol.x).toBe(i * symbolSize);
            }
        });
    });

    describe('spinning', () => {
        it('should start spinning when startSpin is called', () => {
            const reel = new Reel(6, 150, 0);
            reel.startSpin();

            // Simulate update cycle
            reel.update(1);

            // After update with spinning, symbols should have moved
            const firstSymbol = reel.children[0] as PIXI.Sprite;
            // The initial position was 0, it should have moved
            expect(firstSymbol.x).not.toBe(0);
        });

        it('should stop spinning when stopSpin is called', () => {
            const reel = new Reel(6, 150, 0);
            reel.startSpin();

            // Simulate some spinning
            for (let i = 0; i < 10; i++) {
                reel.update(1);
            }

            // Stop spinning
            reel.stopSpin();

            // Continue updating until reel fully stops
            let finalPosition: number = 0;
            for (let i = 0; i < 200; i++) {
                reel.update(1);
                finalPosition = (reel.children[0] as PIXI.Sprite).x;
            }

            // After full stop and snapping, position should be stable
            const stablePosition = finalPosition;
            for (let i = 0; i < 10; i++) {
                reel.update(1);
            }

            expect((reel.children[0] as PIXI.Sprite).x).toBe(stablePosition);
        });

        it('should snap to grid when speed becomes very low', () => {
            const reel = new Reel(6, 150, 0);
            reel.startSpin();

            // Spin for a bit
            for (let i = 0; i < 20; i++) {
                reel.update(1);
            }

            reel.stopSpin();

            // Continue updating until speed drops to 0
            for (let i = 0; i < 100; i++) {
                reel.update(1);
            }

            // After snapping to grid, all symbols should be at valid grid positions
            for (let i = 0; i < 6; i++) {
                const symbol = reel.children[i] as PIXI.Sprite;
                // Position should be a multiple of symbolSize (considering wrapping)
                const expectedPositions = [-150, 0, 150, 300, 450, 600, 750, 900];
                const isValidPosition = expectedPositions.some(
                    (pos) => Math.abs(symbol.x - pos) < 1
                );
                expect(isValidPosition).toBe(true);
            }
        });
    });

    describe('update', () => {
        it('should not update when not spinning and speed is 0', () => {
            const reel = new Reel(6, 150, 0);
            const initialX = (reel.container.getChildAt(0) as PIXI.Sprite).x;

            // Update should do nothing if not spinning
            reel.update(1);

            expect((reel.container.getChildAt(0) as PIXI.Sprite).x).toBe(initialX);
        });

        it('should create symbols with valid textures', () => {
            const reel = new Reel(6, 150, 0);

            // Check that getTexture was called multiple times (once per symbol)
            expect(AssetLoader.getTexture).toHaveBeenCalled();
            expect(AssetLoader.getTexture).toHaveBeenCalledWith(expect.stringMatching(/symbol\d\.png/));
        });
    });
});
