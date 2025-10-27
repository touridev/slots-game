export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    memoryUsage: number;
    drawCalls: number;
    textureMemory: number;
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics = {
        fps: 0,
        frameTime: 0,
        memoryUsage: 0,
        drawCalls: 0,
        textureMemory: 0,
    };

    private frameCount = 0;
    private lastTime = 0;
    private fpsHistory: number[] = [];
    private readonly maxHistoryLength = 60;

    private constructor() {}

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    public update(deltaTime: number, renderer?: any): void {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.metrics.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.fpsHistory.push(this.metrics.fps);

            if (this.fpsHistory.length > this.maxHistoryLength) {
                this.fpsHistory.shift();
            }

            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        this.metrics.frameTime = deltaTime;

        if ('memory' in performance) {
            const memory = (performance as any).memory;
            this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
        }

        if (renderer) {
            this.metrics.drawCalls = renderer.gl?.drawCalls || 0;
            this.metrics.textureMemory = renderer.texture?.managedTextures?.length || 0;
        }
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public getAverageFPS(): number {
        if (this.fpsHistory.length === 0) return 0;
        return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    }

    public isPerformanceLow(threshold: number = 30): boolean {
        return this.getAverageFPS() < threshold;
    }

    public getReport(): string {
        const metrics = this.getMetrics();
        return `
Performance Report:
- FPS: ${metrics.fps} (avg: ${this.getAverageFPS().toFixed(1)})
- Frame Time: ${metrics.frameTime.toFixed(2)}ms
- Memory: ${metrics.memoryUsage.toFixed(2)}MB
- Draw Calls: ${metrics.drawCalls}
- Textures: ${metrics.textureMemory}
        `.trim();
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
