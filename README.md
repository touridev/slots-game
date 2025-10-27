# Slots Game

A slots game built with TypeScript, PixiJS, and Webpack. Has horizontal reel spinning, sound effects, and Spine animations.

## Features

- Horizontal reel spinning with smooth animations
- Sound effects using Howler.js
- Spine animations for wins and decorations
- Responsive design that works on different screen sizes
- TypeScript for type safety
- Unit tests with Jest

## Getting Started

### Requirements

- Node.js (v16 or higher)
- npm (v8 or higher)

### Setup

1. Clone the repo
   ```bash
   git clone <repository-url>
   cd slots-game
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the dev server
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:9000`

### Build

```bash
npm run build
```

Files will be in the `dist/` folder.

## How to Play

1. Click the spin button to start the reels
2. Watch the reels spin horizontally
3. Win detection happens automatically when reels stop
4. Enjoy the sound and visual effects

## Development

### Scripts

- `npm start` - Start dev server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Get test coverage
- `npm run lint` - Run linter

### Project Structure

```
src/
├── assets/           # Game assets
│   ├── images/       # Symbol textures and UI
│   ├── sounds/       # Audio files
│   └── spines/       # Spine animations
├── slots/            # Game logic
│   ├── SlotMachine.ts
│   ├── Reel.ts
│   └── __tests__/
├── ui/               # UI components
│   └── UI.ts
├── utils/            # Utilities
│   ├── AssetLoader.ts
│   ├── sound.ts
│   ├── constants.ts
│   └── __tests__/
├── Game.ts
├── index.ts
└── index.html
```

### Main Components

#### SlotMachine
- Controls multiple reels and game state
- Handles win detection and animations
- Manages spin timing

#### Reel
- Handles horizontal spinning
- Smooth deceleration and snapping
- Symbol positioning

#### AssetLoader
- Loads and caches assets
- Manages textures and animations
- Error handling

#### Sound System
- Uses Howler.js for audio
- Preloads sounds
- Handles errors

## Configuration

Edit `src/utils/constants.ts` to change game settings:

```typescript
export const REEL_CONFIG = {
    COUNT: 5,
    SYMBOLS_PER_REEL: 8,
    SYMBOL_SIZE: 130,
    SPIN_SPEED: 400,
    SLOWDOWN_RATE: 0.95,
};
```

## Testing

```bash
npm test
npm run test:coverage
npm run test:watch
```

Tests cover:
- Reel logic and positioning
- Sound system
- Asset loading

## Customization

### Adding Symbols

1. Add images to `src/assets/images/`
2. Update `REEL_CONFIG.SYMBOL_TEXTURES` in `constants.ts`
3. Rebuild

### Changing Animations

1. Replace Spine files in `src/assets/spines/`
2. Update animation names in `SlotMachine.ts`
3. Adjust timing in `ANIMATION_CONFIG`

### Sound Effects

1. Add audio files to `src/assets/sounds/`
2. Update the `SOUNDS` array in `AssetLoader.ts`
3. Use `sound.play('filename')` in code

## Performance

- Object pooling for sprites
- Efficient rendering
- Asset caching
- Delta time for smooth animation
- Memory management

## Troubleshooting

**Game won't start**
- Check browser console for errors
- Make sure assets are loaded
- Check Node.js version

**Audio not working**
- Check browser audio permissions
- Verify sound file format
- Try different browsers

**Performance issues**
- Reduce symbol count in `REEL_CONFIG`
- Lower animation quality
- Check for memory leaks

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Support

For issues:
- Check troubleshooting section
- Look at existing GitHub issues
- Create a new issue with details
