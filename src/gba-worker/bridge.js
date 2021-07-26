



export const messages = Object.freeze({
    FRAME_UPDATE: 'frame update',
    LOAD_ROM: 'load rom',
    EMULATOR_READY: 'emulator ready',
    PING: 'ping',
    RUN: 'play',
});

export class MessageListener {

    #messageHandler = new Map();

    addHandler(messageType, callback) {
        this.#messageHandler.set(messageType, callback);
    }

    handle(message) {
        let type = message.type;
        if (this.#messageHandler.has(type)) {
            let args = message.args;
            this.#messageHandler.get(type)(...args);
        }
    }

}




