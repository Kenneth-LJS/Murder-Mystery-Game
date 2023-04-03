const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'none',
    target: 'web',
    entry: {
        index: './src/index.tsx',
    },
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'A Victorian Murder Mystery - LIFC Online',
            template: 'src/template.html',
            inject: 'head',
        }),
        new webpack.DefinePlugin({
            'process.env': '(' + JSON.stringify(process.env) + ')',
        }),
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        publicPath: 'auto',
        library: {
            type: 'umd',
        },
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
        // minimize: true,
        // minimizer: [
        //     new TerserPlugin({
        //         terserOptions: {
        //             format: {
        //                 comments: false,
        //             },
        //         },
        //         extractComments: false,
        //     }),
        // ],
    },
    module: {
        rules: [
            {
                // https://webpack.js.org/guides/typescript/
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                // https://webpack.js.org/guides/typescript/
                test: /\.tsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                // https://webpack.js.org/loaders/css-loader/
                test: /\.css$/i,
                exclude: /\.module\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                // https://webpack.js.org/loaders/sass-loader/
                test: /\.s[ac]ss$/i,
                exclude: /\.module\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
            {
                test: /\.module\.(sa|sc|c)ss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                // https://webpack.js.org/guides/asset-management/
                test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
                exclude: /\.inline\.(png|svg|jpg|jpeg|gif|webp)$/i,
                type: 'asset/resource',
            },
            {
                // https://webpack.js.org/guides/asset-management/
                test: /\.inline\.(png|svg|jpg|jpeg|gif|webp)$/i,
                type: 'asset/inline',
            },
            {
                // https://webpack.js.org/guides/asset-management/
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
            {
                // https://webpack.js.org/guides/asset-management/
                test: /\.(mp4|webm)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.puzzle.json$/i,
                type: 'javascript/auto',
                use: [
                    {
                        loader: 'json-loader',
                    },
                    {
                        loader: path.resolve('loaders/puzzle-json.js'),
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};
