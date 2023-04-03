const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'development',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.PUZZLE_MODE': '"development"',
        }),
    ],
});