module.exports = {
    mount: {
        public: { url: "/", static: true },
        src: "/",
        wasm: { url: "/wasm", static: true }
    },
    devOptions: {
        tailwindConfig: './tailwind.config.js',
    },
    plugins: [
        '@snowpack/plugin-postcss',
    ],
}