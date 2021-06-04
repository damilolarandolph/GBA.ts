import loader from '@assemblyscript/loader';


var frames = 0;
var lastFrameTime;
var time;

loader.instantiateStreaming(fetch("/wasm/gba.wasm"), {
    bridge: {
        startFrame: () => {
            if (time == null) {
                time = performance.now();
                lastFrameTime = performance.now();
            }

            ++frames;
            if ((performance.now() - time) >= 1000) {
                console.log(frames, " fps");
                frames = 0;
                time = performance.now();
            }
            if (frames > 0) {
                console.log("Last Frame time: ", performance.now() - lastFrameTime)
                lastFrameTime = performance.now();
            }
        },
        endFrame: () => {
        },
    }
}).then((wasm) => {
    onmessage = function (e) {
        let arry = e.data;
        let view = wasm.exports.__getUint8ArrayView(wasm.exports.getCartData());
        for (let i = 0; i < arry.length; ++i) {
            view[i] = arry[i];
        }
        wasm.exports.run();
    }
})