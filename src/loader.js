import loader from '@assemblyscript/loader';
loader.instantiate(
    fetch("wasm/untouched.wasm"),
).then(({ exports }) => {
    console.log(exports.cpu());
});