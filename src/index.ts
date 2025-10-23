import { Game } from './Game';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init().catch(error => {
        console.error('Failed to initialize game:', error);
    });

    console.log('Slots Game started ✨');
});
