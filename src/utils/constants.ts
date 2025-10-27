export const REEL_CONFIG = {
    COUNT: 5,
    SYMBOLS_PER_REEL: 8,
    SYMBOL_SIZE: 130,
    SYMBOL_TEXTURES: [
        'symbol1.png',
        'symbol2.png',
        'symbol3.png',
        'symbol4.png',
        'symbol5.png',
    ],
    SPIN_SPEED: 400,
    SLOWDOWN_RATE: 0.95,
    STOP_THRESHOLD: 5.0,
    REEL_SPACING: 10,
} as const;

export const GAME_CONFIG = {
    WIDTH: 1280,
    HEIGHT: 800,
    BACKGROUND_COLOR: 0x1099bb,
    BACKGROUND_ALPHA: 0.5,
    BACKGROUND_PADDING: 20,
} as const;

export const UI_CONFIG = {
    SPIN_BUTTON_WIDTH: 150,
    SPIN_BUTTON_HEIGHT: 80,
    SPIN_BUTTON_OFFSET_FROM_BOTTOM: 50,
    BUTTON_HOVER_SCALE: 1.05,
} as const;

export const ANIMATION_CONFIG = {
    WIN_ANIMATION_DURATION: 5000,
    REEL_SPIN_DELAY: 200,
    REEL_STOP_DELAY: 400,
    SPIN_TOTAL_DURATION: 2000,
    EASING_FUNCTION: 'easeOut',
} as const;

export const WIN_CONFIG = {
    WIN_CHANCE: 0.3,
    BONUS_MULTIPLIER: 2.0,
    JACKPOT_CHANCE: 0.01,
} as const;
