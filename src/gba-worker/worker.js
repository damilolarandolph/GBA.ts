import loader from '@assemblyscript/loader';
import * as Comlink from 'comlink';


var frames = 0;
var lastFrameTime;
var time;
var things = {};
let wasmInstance;

class GraphicsController {

    log() {
        console.log('hello');
    }

}


export class GBAWorker {

    /**@type {GraphicsController} */
    graphicsController;

    constructor() {
        this.graphicsController = new GraphicsController();
    }

    /**
     * 
     * @param {Uint8Array} buffer 
     */
    loadRom(buffer) {
        let gba = wasmInstance.exports.GBA.wrap(wasmInstance.exports.gba);
        let cartData = gba.getGamePAK();
        let view = wasmInstance.exports.__getUint8ArrayView(cartData);
        for (let i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        gba.run();
    }

    step() {

    }

    run() {

    }

    stop() {

    }

}



Comlink.expose(GBAWorker);







(async function () {


    wasmInstance = await loader.instantiateStreaming(fetch("/wasm/gba.wasm"), {
        index: {
            "console.log": (msg) => { console.log(wasmInstance.exports.__getString(msg)) }
        }
    })

    wasmInstance.exports._start();


})()

// loader.instantiateStreaming(fetch("/wasm/gba.wasm"), {
//     index: {
//         "console.log": (msg) => { console.log(things.wasm.exports.__getString(msg)) }
//     }
// }).then((wasm) => {
//     things.wasm = wasm;
//     console.log(wasm);
//     wasm.exports._start();
//     onmessage = function (e) {
//         let arry = e.data;
//         let view = wasm.exports.__getUint8ArrayView(wasm.exports.getCartData());
//         for (let i = 0; i < arry.length; ++i) {
//             view[i] = arry[i];
//         }
//         wasm.exports.run();
//     }
// })
