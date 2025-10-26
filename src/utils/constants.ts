/**
 * Reel Configuration
 */
export const REEL_CONFIG = {
    COUNT: 5, // Number of visible reels
    SYMBOLS_PER_REEL: 8,
    SYMBOL_SIZE: 130,
    SYMBOL_TEXTURES: [
        'symbol1.png',
        'symbol2.png',
        'symbol3.png',
        'symbol4.png',
        'symbol5.png',
    ],
    SPIN_SPEED: 400, // Increased from 50 for faster spinning
    SLOWDOWN_RATE: 0.95,
    STOP_THRESHOLD: 5.0, // Increased threshold for earlier snapping
    REEL_SPACING: 10,
} as const;

// TODO: Maybe make these configurable via UI later
// const DEBUG_MODE = false; // for future debugging features

// Experimental settings (remove before production)
// const EXPERIMENTAL_FEATURES = false;
// const AI_DIFFICULTY = false;

/**
 * Game Configuration
 */
export const GAME_CONFIG = {
    WIDTH: 1280,
    HEIGHT: 800,
    BACKGROUND_COLOR: 0x1099bb,
    BACKGROUND_ALPHA: 0.5,
    BACKGROUND_PADDING: 20,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
    SPIN_BUTTON_WIDTH: 150,
    SPIN_BUTTON_HEIGHT: 80,
    SPIN_BUTTON_OFFSET_FROM_BOTTOM: 50,
    BUTTON_HOVER_SCALE: 1.05,
} as const;

/**
 * Animation Configuration
 */
export const ANIMATION_CONFIG = {
    WIN_ANIMATION_DURATION: 5000, // ms
    REEL_SPIN_DELAY: 200, // ms between reels starting
    REEL_STOP_DELAY: 400, // ms between reels stopping
    SPIN_TOTAL_DURATION: 2000, // ms base spin duration (increased to allow proper deceleration)
    // TODO: Make these configurable
    // EASING_FUNCTION: 'easeOut', // Future feature
} as const;

/**
 * Win Detection Configuration
 */
export const WIN_CONFIG = {
    WIN_CHANCE: 0.3, // 30% chance of winning
    // TODO: Make this configurable
    // BONUS_MULTIPLIER: 2.0, // Future feature
    // JACKPOT_CHANCE: 0.01, // 1% chance for jackpot
} as const;
