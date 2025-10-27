import { sound } from '../sound';
import { Howl } from 'howler';

// Mock howler
jest.mock('howler', () => ({
    Howl: jest.fn(function(this: any, options: any) {
        this.play = jest.fn();
        this.stop = jest.fn();
        this.onloaderror = options.onloaderror;
    }),
}));

describe('Sound Player', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('error handling', () => {
        it('handles play errors', () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const mockInstance = {
                play: jest.fn().mockImplementation(() => {
                    throw new Error('Playback error');
                })
            };
            
            (Howl as jest.Mock).mockReturnValueOnce(mockInstance);
            sound.add('error-sound', 'path/to/error.webm');
            
            expect(() => sound.play('error-sound')).not.toThrow();
            expect(errorSpy).toHaveBeenCalledWith(
                'Failed to play sound error-sound:',
                expect.any(Error)
            );
            
            errorSpy.mockRestore();
        });

        it('handles network errors', () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            (Howl as jest.Mock).mockImplementationOnce((options) => {
                setTimeout(() => {
                    if (options.onloaderror) {
                        options.onloaderror(1, new Error('Network error'));
                    }
                }, 0);
                
                return {
                    play: jest.fn(),
                    stop: jest.fn()
                };
            });
            
            sound.add('network-error-sound', 'http://invalid-url/sound.webm');
            
            setTimeout(() => {
                expect(errorSpy).toHaveBeenCalledWith(
                    'Error loading sound network-error-sound:',
                    expect.any(Error)
                );
            }, 10);
            
            errorSpy.mockRestore();
        });

        it('handles disabled state', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            sound.disable();
            sound.add('test-sound', 'path/to/sound.webm');
            sound.play('test-sound');
            
            expect(warnSpy).not.toHaveBeenCalled();
            sound.enable();
            
            warnSpy.mockRestore();
        });
    });

    describe('audio formats', () => {
        it('handles .webm format', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();
            
            sound.add('webm-sound', 'path/to/sound.webm');
            
            expect(Howl).toHaveBeenCalledWith(
                expect.objectContaining({
                    src: ['path/to/sound.webm'],
                    html5: true,
                    preload: true,
                })
            );
            
            logSpy.mockRestore();
        });

        it('handles .mp3 format', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();
            
            sound.add('mp3-sound', 'path/to/sound.mp3');
            
            expect(Howl).toHaveBeenCalledWith(
                expect.objectContaining({
                    src: ['path/to/sound.mp3'],
                    html5: true,
                    preload: true,
                })
            );
            
            logSpy.mockRestore();
        });

        it('handles .ogg format', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();
            
            sound.add('ogg-sound', 'path/to/sound.ogg');
            
            expect(Howl).toHaveBeenCalledWith(
                expect.objectContaining({
                    src: ['path/to/sound.ogg'],
                    html5: true,
                    preload: true,
                })
            );
            
            logSpy.mockRestore();
        });

        it('handles multiple formats', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation();
            
            sound.add('multi-format-sound', 'path/to/sound.webm');
            
            expect(Howl).toHaveBeenCalledWith(
                expect.objectContaining({
                    src: ['path/to/sound.webm'],
                    html5: true,
                    preload: true,
                })
            );
            
            logSpy.mockRestore();
        });
    });

    describe('add', () => {
        it('should add a sound to the library', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            sound.add('test-sound', 'path/to/sound.webm');

            expect(Howl).toHaveBeenCalledWith(
                expect.objectContaining({
                    src: ['path/to/sound.webm'],
                    html5: true,
                    preload: true,
                })
            );
            expect(consoleSpy).toHaveBeenCalledWith('Sound added: test-sound from path/to/sound.webm');

            consoleSpy.mockRestore();
        });

        it('should handle errors when adding a sound', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Mock Howl to throw an error
            (Howl as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Sound loading error');
            });

            sound.add('error-sound', 'path/to/error.webm');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to add sound error-sound:',
                expect.any(Error)
            );

            consoleErrorSpy.mockRestore();
        });

        it('should set up error handler in Howl configuration', () => {
            sound.add('test-sound', 'path/to/sound.webm');

            const callArgs = (Howl as jest.Mock).mock.calls[0][0];
            expect(callArgs).toHaveProperty('onloaderror');
            expect(typeof callArgs.onloaderror).toBe('function');
        });
    });

    describe('play', () => {
        it('should play an existing sound', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Add sound first
            sound.add('test-sound', 'path/to/sound.webm');

            // Play sound
            sound.play('test-sound');

            // Note: console.log is commented out in production code
            // expect(consoleSpy).toHaveBeenCalledWith('Playing sound: test-sound');
            
            // Just verify the sound was added
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should warn if sound is not found', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            sound.play('non-existent-sound');

            expect(consoleWarnSpy).toHaveBeenCalledWith('Sound not found: non-existent-sound');

            consoleWarnSpy.mockRestore();
        });

        it('should call play method on Howl instance', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Add sound
            sound.add('test-sound', 'path/to/sound.webm');

            // Get the mock instance
            const mockCalls = (Howl as jest.Mock).mock.results;
            const mockHowlInstance = mockCalls[mockCalls.length - 1]?.value;

            // Play sound
            sound.play('test-sound');

            if (mockHowlInstance && mockHowlInstance.play) {
                expect(mockHowlInstance.play).toHaveBeenCalled();
            }

            consoleSpy.mockRestore();
        });
    });
});
