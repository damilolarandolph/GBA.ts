import * as loader from '@assemblyscript/loader';
import { DOMTimeStamp } from 'webidl-conversions';
import { messages } from './bridge';


export default class ClientEmulatorBridge {


    /** @type {Renderer} */
    renderer = new Renderer();

    #wasmInstance;

    #core;

    #rafId;

    frames = 0;
    timestamp = 0;

    /** @type {Worker} */
    #worker;

    constructor() {
        this.#worker = new Worker(new URL('./worker.js', import.meta.url));
    }


    runFrame() {
    }

    run() {
        this.#worker.postMessage({ type: messages.RUN });
        setInterval(() => { this.#worker.postMessage({ type: messages.PING }) }, 1000);
    }


    /**
     * 
     * @param {Uint8Array} buffer 
     */
    loadRom(buffer) {

        this.#worker.postMessage({ type: messages.LOAD_ROM, args: [buffer] });
    }

}


class Renderer {

    #gpu;

    frameNotification() {

    }

    set gpu(wrap) {
        this.#gpu = wrap;
    }

}


class Keypad {

}
