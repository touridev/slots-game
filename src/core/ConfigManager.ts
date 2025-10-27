export interface GameConfig {
    display: {
        width: number;
        height: number;
        backgroundColor: number;
        resolution: number;
        autoDensity: boolean;
    };
    reels: {
        count: number;
        symbolsPerReel: number;
        symbolSize: number;
        symbolTextures: string[];
        spinSpeed: number;
        slowdownRate: number;
        stopThreshold: number;
        reelSpacing: number;
    };
    ui: {
        spinButtonWidth: number;
        spinButtonHeight: number;
        spinButtonOffsetFromBottom: number;
        buttonHoverScale: number;
    };
    animation: {
        winAnimationDuration: number;
        reelSpinDelay: number;
        reelStopDelay: number;
        spinTotalDuration: number;
    };
    win: {
        winChance: number;
        bonusMultiplier: number;
        jackpotChance: number;
    };
    performance: {
        enableObjectPooling: boolean;
        maxPoolSize: number;
        enablePerformanceMonitoring: boolean;
        lowFPSThreshold: number;
    };
    debug: {
        enabled: boolean;
        showFPS: boolean;
        showPerformanceMetrics: boolean;
        logEvents: boolean;
    };
}

const DEFAULT_CONFIG: GameConfig = {
    display: {
        width: 1280,
        height: 800,
        backgroundColor: 0x1a1a2e,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    },
    reels: {
        count: 5,
        symbolsPerReel: 8,
        symbolSize: 130,
        symbolTextures: [
            'symbol1.png',
            'symbol2.png',
            'symbol3.png',
            'symbol4.png',
            'symbol5.png',
        ],
        spinSpeed: 400,
        slowdownRate: 0.95,
        stopThreshold: 5.0,
        reelSpacing: 10,
    },
    ui: {
        spinButtonWidth: 150,
        spinButtonHeight: 80,
        spinButtonOffsetFromBottom: 50,
        buttonHoverScale: 1.05,
    },
    animation: {
        winAnimationDuration: 5000,
        reelSpinDelay: 200,
        reelStopDelay: 400,
        spinTotalDuration: 2000,
    },
    win: {
        winChance: 0.3,
        bonusMultiplier: 2.0,
        jackpotChance: 0.01,
    },
    performance: {
        enableObjectPooling: true,
        maxPoolSize: 100,
        enablePerformanceMonitoring: true,
        lowFPSThreshold: 30,
    },
    debug: {
        enabled: false,
        showFPS: false,
        showPerformanceMetrics: false,
        logEvents: false,
    },
};

export class ConfigManager {
    private static instance: ConfigManager;
    private config: GameConfig;
    private listeners: Map<string, (value: any) => void> = new Map();

    private constructor() {
        this.config = this.deepClone(DEFAULT_CONFIG);
        this.loadFromLocalStorage();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public get<K extends keyof GameConfig>(key: K): GameConfig[K];
    public get<K extends keyof GameConfig, T extends keyof GameConfig[K]>(
        key: K,
        subKey: T
    ): GameConfig[K][T];
    public get(key: string, subKey?: string): any {
        if (subKey) {
            return this.config[key as keyof GameConfig]?.[subKey as keyof GameConfig[keyof GameConfig]];
        }
        return this.config[key as keyof GameConfig];
    }

    public set<K extends keyof GameConfig>(key: K, value: GameConfig[K]): void;
    public set<K extends keyof GameConfig, T extends keyof GameConfig[K]>(
        key: K,
        subKey: T,
        value: GameConfig[K][T]
    ): void;
    public set(key: string, subKeyOrValue: string | any, value?: any): void {
        if (value !== undefined) {
            if (this.config[key as keyof GameConfig]) {
                (this.config[key as keyof GameConfig] as any)[subKeyOrValue] = value;
                this.notifyListeners(`${key}.${subKeyOrValue}`, value);
            }
        } else {
            (this.config as any)[key] = subKeyOrValue;
            this.notifyListeners(key, subKeyOrValue);
        }

        this.saveToLocalStorage();
    }

    public onChange(path: string, callback: (value: any) => void): void {
        this.listeners.set(path, callback);
    }

    public offChange(path: string): void {
        this.listeners.delete(path);
    }

    public reset(): void {
        this.config = this.deepClone(DEFAULT_CONFIG);
        this.saveToLocalStorage();
    }

    public getAll(): GameConfig {
        return this.deepClone(this.config);
    }

    public validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.config.display.width <= 0 || this.config.display.height <= 0) {
            errors.push('Display dimensions must be positive');
        }

        if (this.config.reels.count <= 0) {
            errors.push('Reel count must be positive');
        }
        if (this.config.reels.symbolsPerReel <= 0) {
            errors.push('Symbols per reel must be positive');
        }
        if (this.config.reels.symbolSize <= 0) {
            errors.push('Symbol size must be positive');
        }

        if (this.config.win.winChance < 0 || this.config.win.winChance > 1) {
            errors.push('Win chance must be between 0 and 1');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private notifyListeners(path: string, value: any): void {
        const listener = this.listeners.get(path);
        if (listener) {
            listener(value);
        }
    }

    private loadFromLocalStorage(): void {
        try {
            const saved = localStorage.getItem('slots-game-config');
            if (saved) {
                const parsedConfig = JSON.parse(saved);
                this.config = this.mergeConfig(this.config, parsedConfig);
            }
        } catch (error) {
            console.warn('Failed to load config from localStorage:', error);
        }
    }

    private saveToLocalStorage(): void {
        try {
            localStorage.setItem('slots-game-config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Failed to save config to localStorage:', error);
        }
    }

    private deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    private mergeConfig(target: any, source: any): any {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeConfig(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }
}

export const configManager = ConfigManager.getInstance();
