import * as Comlink from 'comlink';
import { GBAWorker } from './worker';

export default class GBA {
    worker;
    /** @type {GBAWorker} */
    _gbaWorker;

    /** @type {HTMLCanvasElement} */
    _canvas;

    /** @private */
    _currentBufferIndex = 1;

    async bootWorker() {
        this.worker = new Worker(new URL('./worker.js', import.meta.url));
        let _workerClass = Comlink.wrap(this.worker);
        this._gbaWorker = await new _workerClass();
        this._gbaWorker.graphicsController.log();
    }


    /**
     * 
     * @param {HTMLCanvasElement} canvasEl 
     */
    setCanvas(canvasEl) {
        this._canvas = canvasEl;
    }


    drawCanvas() {

    }

    swapBuffers() {

    }

    get gbaWorker() {

        return this._gbaWorker;
    }
}