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
        this.#worker.addEventListener('message', this.#workerMessageHandler.bind(this));
        this.renderer.play();
    }

    #workerMessageHandler(msg) {
        const type = msg.data.type;
        const args = msg.data.args ? msg.data.args : [];

        switch (type) {
            case messages.FRAME_UPDATE:
                this.renderer.updateFrame(...args);
                break;
        }

    }


    /**
     * 
     * @param {Uint8Array} buffer 
     */
    loadRom(buffer) {

        this.#worker.postMessage({ type: messages.LOAD_ROM, args: [buffer] });
    }

    pause() {
        this.#worker.postMessage({ type: messages.PAUSE });
    }

}



class Renderer {

    /** @type {Uint8ClampedArray} */
    currentFrame;
    /** @type {Worker} */
    #worker;
    /** @type{HTMLCanvasElement} */
    #canvas;
    /** @type {CanvasRenderingContext2D} */
    #context;

    /** @type {Worker} */
    #graphicsWorker;

    #dirtyFrame = false;

    constructor() {
        this.#graphicsWorker = new Worker(new URL('./graphics-worker.js', import.meta.url));
    }

    play() {
        requestAnimationFrame(this.play.bind(this));
        if (this.currentFrame && this.#dirtyFrame) {
            // console.log('frame put');
            let imageData = new ImageData(this.currentFrame, 240, 160);
            // console.log(imageData);
            // console.log(imageData.width, imageData.height, imageData.data.fill(0xf));
            this.#context.putImageData(imageData, 0, 0);
            //   this.#context.drawImage(this.#canvas, 0, 0, 2 * 240, 2 * 160);
        }
    }

    /**
     * 
     * @param {Uint8ClampedArray} newFrame 
     */
    updateFrame(newFrame) {
        this.currentFrame = newFrame;
        //  console.log(newFrame);
        this.#dirtyFrame = true;
        // this.#graphicsWorker.postMessage({ type: messages.SCALE_FRAME, args: { frame: newFrame, scale: 2 } });
    }

    set worker(webWorker) {
        this.#worker = webWorker;
    }

    set canvas(canvasEl) {
        this.#canvas = canvasEl;
        this.#context = this.#canvas.getContext('2d');
    }

}


class Keypad {

}
