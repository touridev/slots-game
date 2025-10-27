import * as PIXI from 'pixi.js';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
    alpha: number;
    rotation: number;
    rotationSpeed: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private container: PIXI.Container;
    private graphics: PIXI.Graphics;

    constructor() {
        this.container = new PIXI.Container();
        this.graphics = new PIXI.Graphics();
        this.container.addChild(this.graphics);
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public createExplosion(x: number, y: number, color: number = 0xffd700, count: number = 20): void {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                size: 3 + Math.random() * 4,
                color: color,
                alpha: 1.0,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    public createSparkles(x: number, y: number, count: number = 15): void {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
                maxLife: 1.0,
                size: 2 + Math.random() * 3,
                color: 0xffffff,
                alpha: 1.0,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    public createCoinRain(x: number, y: number, count: number = 10): void {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 200,
                y: y - 50,
                vx: (Math.random() - 0.5) * 1,
                vy: 1 + Math.random() * 2,
                life: 1.0,
                maxLife: 1.0,
                size: 4 + Math.random() * 3,
                color: 0xffd700,
                alpha: 1.0,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    public update(delta: number): void {
        this.graphics.clear();

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity
            particle.vy += 0.1;
            
            // Update rotation
            particle.rotation += particle.rotationSpeed;
            
            // Update life
            particle.life -= delta * 0.01;
            particle.alpha = particle.life / particle.maxLife;
            
            // Update size (shrink over time)
            const currentSize = particle.size * particle.alpha;
            
            // Draw particle
            this.graphics.beginFill(particle.color, particle.alpha);
            this.graphics.drawCircle(particle.x, particle.y, currentSize);
            this.graphics.endFill();
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    public clear(): void {
        this.particles = [];
        this.graphics.clear();
    }

    public destroy(): void {
        this.clear();
        this.container.destroy();
    }
}
