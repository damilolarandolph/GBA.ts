const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/index.js'),
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        publicPath: "/",
        contentBase: "./public",
        watchContentBase: true
    },
    output: {
        path: path.resolve(__dirname, 'public/js'),
        filename: 'main.js'
    }
}