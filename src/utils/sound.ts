// TODO: Implement sound player using the "howler" package
export const sound = {
    add: (alias: string, url: string): void => {
        console.log(`Sound added: ${alias} from ${url}`);
    },
    play: (alias: string): void => {
        console.log(`Playing sound: ${alias}`);
    }
};
