/**
 * Simple event system for game components
 */

export type EventCallback<T = any> = (data: T) => void;

export interface GameEventMap {
    'spin:start': { timestamp: number };
    'spin:stop': { timestamp: number };
    'win:detected': { winType: string; multiplier: number };
    'reel:stopped': { reelIndex: number };
    'asset:loaded': { assetType: string; count: number };
    'error:occurred': { error: Error; context: string };
}

export class EventManager {
    private static instance: EventManager;
    private listeners: Map<keyof GameEventMap, EventCallback[]> = new Map();

    private constructor() {}

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public on<K extends keyof GameEventMap>(
        event: K,
        callback: EventCallback<GameEventMap[K]>
    ): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    public off<K extends keyof GameEventMap>(
        event: K,
        callback: EventCallback<GameEventMap[K]>
    ): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    public emit<K extends keyof GameEventMap>(
        event: K,
        data: GameEventMap[K]
    ): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    public clear(event: keyof GameEventMap): void {
        this.listeners.delete(event);
    }

    public clearAll(): void {
        this.listeners.clear();
    }
}

export const eventManager = EventManager.getInstance();
