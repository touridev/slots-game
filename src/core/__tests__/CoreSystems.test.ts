import { EventManager } from '../EventManager';
import { ConfigManager } from '../ConfigManager';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { SpritePool } from '../SpritePool';

describe('Core Systems', () => {
    describe('EventManager', () => {
        let eventManager: EventManager;

        beforeEach(() => {
            eventManager = EventManager.getInstance();
            eventManager.clearAll();
        });

        it('should be a singleton', () => {
            const instance1 = EventManager.getInstance();
            const instance2 = EventManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should emit and listen to events', () => {
            const callback = jest.fn();
            eventManager.on('spin:start', callback);
            
            eventManager.emit('spin:start', { timestamp: Date.now() });
            
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                timestamp: expect.any(Number)
            }));
        });

        it('should unsubscribe from events', () => {
            const callback = jest.fn();
            eventManager.on('spin:start', callback);
            eventManager.off('spin:start', callback);
            
            eventManager.emit('spin:start', { timestamp: Date.now() });
            
            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle errors in event listeners', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            
            eventManager.on('spin:start', errorCallback);
            eventManager.emit('spin:start', { timestamp: Date.now() });
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error in event listener for spin:start:',
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('ConfigManager', () => {
        let configManager: ConfigManager;

        beforeEach(() => {
            configManager = ConfigManager.getInstance();
            configManager.reset();
        });

        it('should be a singleton', () => {
            const instance1 = ConfigManager.getInstance();
            const instance2 = ConfigManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should get configuration values', () => {
            const reelCount = configManager.get('reels', 'count');
            expect(reelCount).toBe(5);
        });

        it('should set configuration values', () => {
            configManager.set('reels', 'count', 10);
            const reelCount = configManager.get('reels', 'count');
            expect(reelCount).toBe(10);
        });

        it('should validate configuration', () => {
            const validation = configManager.validate();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should detect invalid configuration', () => {
            configManager.set('reels', 'count', -1);
            const validation = configManager.validate();
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Reel count must be positive');
        });

        it('should notify listeners of changes', () => {
            const callback = jest.fn();
            configManager.onChange('reels.count', callback);
            
            configManager.set('reels', 'count', 7);
            
            // The callback should be called with the new value
            expect(callback).toHaveBeenCalledWith(7);
        });
    });

    describe('PerformanceMonitor', () => {
        let performanceMonitor: PerformanceMonitor;

        beforeEach(() => {
            performanceMonitor = PerformanceMonitor.getInstance();
        });

        it('should be a singleton', () => {
            const instance1 = PerformanceMonitor.getInstance();
            const instance2 = PerformanceMonitor.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should track performance metrics', () => {
            // Simulate multiple frames to get FPS calculation
            for (let i = 0; i < 5; i++) {
                performanceMonitor.update(16.67); // ~60fps
            }
            
            const metrics = performanceMonitor.getMetrics();
            expect(metrics.frameTime).toBe(16.67);
            expect(metrics.fps).toBeGreaterThan(0);
        });

        it('should calculate average FPS', () => {
            // Simulate multiple frames
            for (let i = 0; i < 10; i++) {
                performanceMonitor.update(16.67);
            }
            
            const avgFPS = performanceMonitor.getAverageFPS();
            expect(avgFPS).toBeGreaterThan(0);
        });

        it('should detect low performance', () => {
            // Simulate low FPS
            for (let i = 0; i < 10; i++) {
                performanceMonitor.update(50); // ~20fps
            }
            
            const isLow = performanceMonitor.isPerformanceLow(30);
            expect(isLow).toBe(true);
        });

        it('should generate performance report', () => {
            performanceMonitor.update(16.67);
            const report = performanceMonitor.getReport();
            
            expect(report).toContain('Performance Report');
            expect(report).toContain('FPS');
            expect(report).toContain('Frame Time');
        });
    });

    describe('SpritePool', () => {
        let spritePool: SpritePool;

        beforeEach(() => {
            spritePool = SpritePool.getInstance();
            spritePool.clear();
        });

        it('should be a singleton', () => {
            const instance1 = SpritePool.getInstance();
            const instance2 = SpritePool.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should create and return sprites', () => {
            // Mock AssetLoader
            jest.doMock('../../utils/AssetLoader', () => ({
                AssetLoader: {
                    getTexture: jest.fn().mockReturnValue({
                        textureCacheIds: ['test-texture']
                    })
                }
            }));

            const sprite = spritePool.getSprite('test-texture', 100, 100);
            expect(sprite).toBeDefined();
            expect(sprite.width).toBe(100);
            expect(sprite.height).toBe(100);

            spritePool.returnSprite(sprite);
            expect(sprite.visible).toBe(false);
        });

        it('should pre-populate pools', () => {
            spritePool.prePopulate('test-texture', 5, 100, 100);
            
            const stats = spritePool.getStats();
            expect(stats['test-texture_100_100'].available).toBe(5);
        });

        it('should track pool statistics', () => {
            spritePool.prePopulate('test-texture', 3, 100, 100);
            
            const stats = spritePool.getStats();
            expect(stats['test-texture_100_100']).toEqual({
                total: 3,
                available: 3,
                active: 0
            });
        });
    });
});
