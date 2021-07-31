import * as loader from '@assemblyscript/loader';
import { colorize } from 'assemblyscript';
import { MessageListener, messages } from './bridge';


export default class Emulator {



    #wasmInstance;

    #core;
    #gpu;

    #rafId;
    #canvas;

    frames = 0;
    timestamp = 0;
    messageHandler = new MessageListener();
    readBuffer = new Uint8ClampedArray()


    constructor() {
        this.boot();
    }

    initHandlers() {

    }

    handleClientMessage(ev) {
        let type = ev.data.type;
        let args = ev.data.args ? ev.data.args : [];
        switch (type) {
            case messages.LOAD_ROM:
                this.loadRom(...args);
                break;
            case messages.RUN:
                this.run(...args);
                break;
            case messages.PING:
                console.log('ping received');
                break;
        }
    }

    frameNotification(arrayPointer) {
        //console.log(arrayPointer);
        // console.log(this.#wasmInstance.exports);
        let array = this.#wasmInstance.exports.__getUint8ClampedArray(arrayPointer);

        ++this.frames;
        self.postMessage({ type: messages.FRAME_UPDATE, args: [array] });
    }

    async boot() {
        let wasmInstance = await loader.instantiateStreaming(fetch("/wasm/gba.wasm"), {
            index: {
                "console.log": (msg) => { console.log(this.#wasmInstance.exports.__getString(msg)) },
                "callbacks.newFrame": this.frameNotification.bind(this)
            }
        })
        this.#wasmInstance = wasmInstance;
        this.#wasmInstance.exports._start();
        this.#core = this.#wasmInstance.exports.GBA.wrap(this.#wasmInstance.exports.gba);
        this.#gpu = this.#wasmInstance.exports.VideoController.wrap(this.#core.getVideo());

        console.log(this.#wasmInstance.exports);
    }

    runFrame() {
        this.#rafId = setTimeout(this.runFrame.bind(this));
        // if (performance.now() - this.timestamp >= 1000) {
        //     console.log("FPS: ", this.frames);
        //     this.timestamp = performance.now()
        //     this.frames = 0;
        // }
        this.#core.runFrame();
        //  this.sendFrameNotifcation();
    }

    run() {
        setInterval(() => {
            console.log("FPS: ", this.frames);
            this.frames = 0;
        }, 1000)
        this.runFrame();
    }



    sendFrameNotifcation() {
        self.postMessage({ type: messages.FRAME_UPDATE });
    }



    /**
     * 
     * @param {Uint8Array} buffer 
     */
    loadRom(buffer) {
        let cartData = this.#core.getGamePAK();
        let view = this.#wasmInstance.exports.__getUint8ArrayView(cartData);
        for (let i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
    }

}




class Keypad {

}

let emulator = new Emulator();


self.onmessage = emulator.handleClientMessage.bind(emulator);