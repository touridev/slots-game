import { Reel } from '../Reel';
import * as PIXI from 'pixi.js';
import { AssetLoader } from '../../utils/AssetLoader';

// Mock AssetLoader
jest.mock('../../utils/AssetLoader');

describe('Reel', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock AssetLoader.getTexture to return a mock texture
        (AssetLoader.getTexture as jest.Mock).mockReturnValue(
            new PIXI.Texture(new PIXI.BaseTexture())
        );
    });

    // TODO: Add more edge case tests
    // TODO: Test performance with many symbols

    describe('constructor and symbol creation', () => {
        it('should create a reel with the correct number of symbols', () => {
            const symbolCount = 6;
            const symbolSize = 150;
            const reel = new Reel(symbolCount, symbolSize);

            expect(reel.children.length).toBe(symbolCount);
        });

        it('should initialize symbols with correct size', () => {
            const symbolSize = 150;
            const reel = new Reel(6, symbolSize);

            // Check first symbol dimensions
            const firstSymbol = reel.children[0] as PIXI.Sprite;
            expect(firstSymbol.width).toBe(symbolSize);
            expect(firstSymbol.height).toBe(symbolSize);
        });

        it('should position symbols horizontally', () => {
            const symbolSize = 150;
            const reel = new Reel(6, symbolSize);

            for (let i = 0; i < 6; i++) {
                const symbol = reel.children[i] as PIXI.Sprite;
                expect(symbol.x).toBe(i * symbolSize);
            }
        });
    });

    describe('spinning', () => {
        it('should start spinning when startSpin is called', () => {
            const reel = new Reel(6, 150);
            reel.startSpin();

            // Simulate update cycle
            reel.update(1);

            // After update with spinning, symbols should have moved
            const firstSymbol = reel.children[0] as PIXI.Sprite;
            // The initial position was 0, it should have moved
            expect(firstSymbol.x).not.toBe(0);
        });

        it('should stop spinning when stopSpin is called', () => {
            const reel = new Reel(6, 150);
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
            const reel = new Reel(6, 150);
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
            const reel = new Reel(6, 150);
            const initialX = (reel.container.getChildAt(0) as PIXI.Sprite).x;

            // Update should do nothing if not spinning
            reel.update(1);

            expect((reel.container.getChildAt(0) as PIXI.Sprite).x).toBe(initialX);
        });

        it('should create symbols with valid textures', () => {
            const reel = new Reel(6, 150);

            // Check that getTexture was called multiple times (once per symbol)
            expect(AssetLoader.getTexture).toHaveBeenCalled();
            expect(AssetLoader.getTexture).toHaveBeenCalledWith(expect.stringMatching(/symbol\d\.png/));
        });
    });
});
