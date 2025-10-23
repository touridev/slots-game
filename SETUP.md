# Slots Game - Setup and Development Guide

## Overview

This is a TypeScript-based slots game built with [PixiJS](https://pixijs.com/) for 2D rendering and [Howler.js](https://howlerjs.com/) for audio playback. The game features horizontal spinning reels, win detection, and animations powered by Spine animations.

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

## Installation

### 1. Clone or Navigate to Project Directory

```bash
cd slots-game
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- **pixi.js** - 2D rendering engine
- **pixi-spine** - Spine animation support for PixiJS
- **howler** - Audio playback library
- **typescript** - TypeScript compiler
- **webpack** - Module bundler
- **jest** - Testing framework

## Development

### Starting Development Server

```bash
npm start
```

This starts a development server with hot reloading at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

Creates an optimized production build in the `dist/` folder.

### Linting Code

```bash
npm run lint
```

Runs ESLint to check for code quality issues.

## Testing

### Running Tests

```bash
npm test
```

Runs all unit tests using Jest.

### Running Tests in Watch Mode

```bash
npm run test:watch
```

Automatically reruns tests when files change.

### Generating Coverage Reports

```bash
npm run test:coverage
```

Generates a test coverage report.

## Project Structure

```
slots-game/
├── src/
│   ├── assets/
│   │   ├── images/        # Game sprites and textures
│   │   ├── sounds/        # Audio files
│   │   └── spines/        # Spine animation data
│   ├── slots/
│   │   ├── Reel.ts        # Individual reel spinning logic
│   │   ├── SlotMachine.ts # Main slot machine controller
│   │   └── __tests__/     # Reel unit tests
│   ├── ui/
│   │   └── UI.ts          # User interface components
│   ├── utils/
│   │   ├── AssetLoader.ts # Asset loading utilities
│   │   ├── sound.ts       # Sound player using Howler
│   │   ├── constants.ts   # Global configuration constants
│   │   └── __tests__/     # Sound player unit tests
│   ├── Game.ts            # Main game controller
│   └── index.ts           # Entry point
├── dist/                  # Build output
├── package.json           # NPM configuration
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack configuration
└── jest.config.js         # Jest configuration
```

## Key Features Implemented

### 1. **Sound Player** (`src/utils/sound.ts`)
- Built on Howler.js for cross-browser audio support
- Methods: `add(alias, url)` and `play(alias)`
- Includes error handling and loading detection

### 2. **Reel Spinning** (`src/slots/Reel.ts`)
- **Horizontal spinning** with smooth animation
- Symbols wrap around continuously
- Configurable spin speed and slowdown rate
- Grid snapping for precise symbol alignment
- Updates on each frame for smooth performance

### 3. **Slot Machine** (`src/slots/SlotMachine.ts`)
- Controls multiple reels with staggered spinning
- Win detection with random probability
- Spine animation playback for win state
- Button disable/enable during spins

### 4. **UI Components** (`src/ui/UI.ts`)
- Interactive spin button with hover effects
- Sound feedback on button interactions
- Responsive positioning

### 5. **Game Configuration** (`src/utils/constants.ts`)
- Centralized configuration for all game parameters
- Easy to adjust game settings without code changes
- Includes reel, UI, animation, and win settings

## Configuration

All game settings can be modified in `src/utils/constants.ts`:

```typescript
// Example: Adjust win probability
export const WIN_CONFIG = {
    WIN_CHANCE: 0.3, // 30% chance of winning
};

// Example: Change spin speed
export const REEL_CONFIG = {
    SPIN_SPEED: 50, // Pixels per frame
    SLOWDOWN_RATE: 0.95, // Deceleration rate
};
```

## Testing

The project includes comprehensive unit tests:

### Reel Tests (`src/slots/__tests__/Reel.test.ts`)
- Symbol creation validation
- Spinning and stopping functionality
- Grid snapping verification
- Position updates during spin

### Sound Player Tests (`src/utils/__tests__/sound.test.ts`)
- Sound addition to library
- Sound playback
- Error handling
- Missing sound warnings

Run tests with: `npm test`

## Git History

The project uses descriptive Git commits for tracking development:

```
feat(audio): implement howler-based sound player with error handling
feat(reels): implement horizontal spinning logic with symbol rotation
feat(animations): implement win animation with big-boom-h spine playback
test: add comprehensive unit tests for Reel and Sound player with Jest
refactor: extract constants and improve code documentation and maintainability
```

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Considerations

- Uses WebGL rendering via PixiJS
- Efficient sprite batching for better performance
- Audio preloading with HTML5 fallback
- Code splitting opportunities for bundle optimization

## Troubleshooting

### Sounds Not Playing
- Check browser console for errors
- Verify audio files exist in `src/assets/sounds/`
- Ensure Howler.js is properly initialized

### Animations Not Displaying
- Verify Spine JSON files are in `src/assets/spines/`
- Check animation names match in the code

### Build Fails
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`

## Development Best Practices

1. **Constants**: Always use constants from `src/utils/constants.ts`
2. **Type Safety**: Ensure all TypeScript types are properly defined
3. **Testing**: Add tests when implementing new features
4. **Documentation**: Use JSDoc comments for all public methods
5. **Git Commits**: Use descriptive commit messages with type prefixes (feat, fix, test, refactor)

## Future Enhancements

- Add more complex win detection logic (matching symbols)
- Implement bet multiplier system
- Add sound volume controls
- Create difficulty levels
- Add leaderboard functionality
- Implement save/load game state

## Support

For issues or questions, please check:
1. Project documentation in this file
2. Inline code comments and JSDoc
3. Test files for usage examples
4. Git commit history for implementation details

---

**Last Updated**: October 2025
