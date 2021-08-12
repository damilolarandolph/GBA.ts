import * as loader from '@assemblyscript/loader';
import { MessageListener, messages } from './bridge';
import fs from 'indexeddb-fs';

let arr = new Uint32Array(1);
function toHexString(val) {
    arr[0] = val;
    let num = arr[0]
    return num.toString(16).toUpperCase().padStart(8, '0');
}

const format = toHexString;


class BufferedLogger {
    #buffer = "";

    dump() {
        // fs.writeFile('log.txt', this.#buffer);
        console.log(this.#buffer);
        this.#buffer = "";
    }

    log(s) {
        this.#buffer = this.#buffer + s;
    }
}
const fastLogger2 = new BufferedLogger();
const fastLogger = new BufferedLogger();

export class Keys {
    static BUTTON_A = 0;
    static BUTTON_B = 1;
    static SELECT = 2;
    static START = 3;
    static RIGHT = 4;
    static LEFT = 5;
    static UP = 6;
    static DOWN = 7;
    static BUTTON_R = 8;
    static BUTTON_L = 9;
}
export default class Emulator {



    #wasmInstance;

    #core;
    #gpu;
    #keyPad;

    #rafId;
    #canvas;
    #fpsInterval;

    frames = 0;
    timestamp = 0;
    messageHandler = new MessageListener();
    readBuffer = new Uint8ClampedArray()



    constructor() {
        this.boot();
    }

    initHandlers() {

    }

    handleClientMessage({ data: { type, args = [] } }) {
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
            case messages.PAUSE:
                clearTimeout(this.#rafId);
                clearInterval(this.#fpsInterval);
                fastLogger.dump();
                fastLogger2.dump();
                break;
            case messages.KEYDOWN:
                this.#keyPad.pressKey(args[0]);
                break;
            case messages.KEYUP:
                this.#keyPad.releaseKey(args[0]);
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
                "console.log": (msg) => {/* fastLogger(this.#wasmInstance.exports.__getString(msg)) */ },
                "callbacks.newFrame": this.frameNotification.bind(this),
                "loggers.logCPU":
                    (
                        r0,
                        r1,
                        r2,
                        r3,
                        r4,
                        r5,
                        r6,
                        r7,
                        r8,
                        r9,
                        r10,
                        r11,
                        r12,
                        r13,
                        r14,
                        r15,
                        adjustedPC,
                        cspr,
                        opcode,
                    ) => {
                        //                 fastLogger.log(`
                        // R0: ${toHexString(r0)} R1: ${toHexString(r1)} R2: ${toHexString(r2)} R3: ${toHexString(r3)}
                        // R4: ${toHexString(r4)} R5: ${toHexString(r5)} R6: ${toHexString(r6)} R7: ${toHexString(r7)}
                        // R8: ${toHexString(r8)} R9: ${toHexString(r9)} R10: ${toHexString(r10)} R11: ${toHexString(r11)}
                        // R12: ${toHexString(r12)} R13: ${toHexString(r13)} R14: ${toHexString(r14)}
                        // PC: ${toHexString(r15)} PC (adjusted): ${toHexString(adjustedPC)}
                        // CSPR: ${toHexString(cspr)}
                        // FLAGS: ${((cspr >>> 31) & 0x1) != 0 ? 'N' : '-'}${((cspr >>> 30) & 0x1) != 0 ? 'Z' : '-'}${((cspr >>> 29) & 0x1) != 0 ? 'C' : '-'}${((cspr >>> 28) & 0x1) ? 'V' : '-'}
                        // THUMB: ${((cspr >>> 5) & 0x1) != 0 ? "Yes" : "No"}
                        // OPCODE: ${toHexString(opcode)} \n
                        // `);
                        fastLogger2.log(format(r0) +
                            " " + format(r1) +
                            " " + format(r2) +
                            " " + format(r3) +
                            " " + format(r4) +
                            " " + format(r5) +
                            " " + format(r6) +
                            " " + format(r7) +
                            " " + format(r8) +
                            " " + format(r9) +
                            " " + format(r10) +
                            " " + format(r11) +
                            " " + format(r12) +
                            " " + format(r13) +
                            " " + format(r14) +
                            " " + format(adjustedPC) +
                            " " + format(cspr) + '\n')
                    }
            }
        })
        this.#wasmInstance = wasmInstance;
        this.#wasmInstance.exports._start();
        this.#core = this.#wasmInstance.exports.GBA.wrap(this.#wasmInstance.exports.gba);
        this.#gpu = this.#wasmInstance.exports.VideoController.wrap(this.#core.getVideo());
        this.#keyPad = this.#wasmInstance.exports.Keypad.wrap(this.#core.getKeyPad());

        //console.log(this.#wasmInstance.exports);
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
        this.#fpsInterval = setInterval(() => {
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