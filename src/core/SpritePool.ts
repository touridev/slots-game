/**
 * Reuses sprite objects to reduce garbage collection
 */

import * as PIXI from 'pixi.js';
import { AssetLoader } from '../utils/AssetLoader';

export class SpritePool {
    private static instance: SpritePool;
    private pools: Map<string, PIXI.Sprite[]> = new Map();
    private activeSprites: Set<PIXI.Sprite> = new Set();

    private constructor() {}

    public static getInstance(): SpritePool {
        if (!SpritePool.instance) {
            SpritePool.instance = new SpritePool();
        }
        return SpritePool.instance;
    }

    public getSprite(textureName: string, width?: number, height?: number): PIXI.Sprite {
        const poolKey = `${textureName}_${width || 'default'}_${height || 'default'}`;
        
        if (!this.pools.has(poolKey)) {
            this.pools.set(poolKey, []);
        }

        const pool = this.pools.get(poolKey)!;
        let sprite: PIXI.Sprite;

        if (pool.length > 0) {
            sprite = pool.pop()!;
            sprite.visible = true;
            sprite.alpha = 1;
            sprite.rotation = 0;
            sprite.scale.set(1);
        } else {
            sprite = new PIXI.Sprite(AssetLoader.getTexture(textureName));
            if (width) sprite.width = width;
            if (height) sprite.height = height;
        }

        this.activeSprites.add(sprite);
        return sprite;
    }

    public returnSprite(sprite: PIXI.Sprite): void {
        if (!this.activeSprites.has(sprite)) {
            console.warn('Attempting to return sprite that is not from this pool');
            return;
        }

        sprite.visible = false;
        sprite.alpha = 1;
        sprite.rotation = 0;
        sprite.scale.set(1);
        sprite.x = 0;
        sprite.y = 0;
        sprite.interactive = false;

        if (sprite.parent) {
            sprite.parent.removeChild(sprite);
        }

        const textureName = sprite.texture.textureCacheIds[0] || 'unknown';
        const poolKey = `${textureName}_${sprite.width}_${sprite.height}`;
        
        if (!this.pools.has(poolKey)) {
            this.pools.set(poolKey, []);
        }

        this.pools.get(poolKey)!.push(sprite);
        this.activeSprites.delete(sprite);
    }

    public prePopulate(textureName: string, count: number, width?: number, height?: number): void {
        const poolKey = `${textureName}_${width || 'default'}_${height || 'default'}`;
        
        if (!this.pools.has(poolKey)) {
            this.pools.set(poolKey, []);
        }

        const pool = this.pools.get(poolKey)!;
        
        for (let i = 0; i < count; i++) {
            const sprite = new PIXI.Sprite(AssetLoader.getTexture(textureName));
            if (width) sprite.width = width;
            if (height) sprite.height = height;
            sprite.visible = false;
            pool.push(sprite);
        }
    }

    public getStats(): { [key: string]: { total: number; available: number; active: number } } {
        const stats: { [key: string]: { total: number; available: number; active: number } } = {};
        
        for (const [poolKey, pool] of this.pools.entries()) {
            const active = Array.from(this.activeSprites).filter(sprite => {
                const textureName = sprite.texture.textureCacheIds[0] || 'unknown';
                return `${textureName}_${sprite.width}_${sprite.height}` === poolKey;
            }).length;

            stats[poolKey] = {
                total: pool.length + active,
                available: pool.length,
                active: active
            };
        }

        return stats;
    }

    public clear(): void {
        for (const pool of this.pools.values()) {
            pool.forEach(sprite => sprite.destroy());
            pool.length = 0;
        }
        this.pools.clear();
        this.activeSprites.clear();
    }
}

export const spritePool = SpritePool.getInstance();
