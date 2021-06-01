const worker = new Worker(new URL('./worker.js', import.meta.url));
let romInput = document.getElementById('rom')
romInput.addEventListener('change', async function (e) {
    let file = e.target.files[0];
    let buffer = await file.arrayBuffer();
    let arry = new Uint8Array(buffer);
    worker.postMessage(arry);
});