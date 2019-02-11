/*global Mix*/
const path = require('path')
const mix = require('laravel-mix')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const autoprefixer = require('autoprefixer')

const fs = require('fs')

const isHMR = process.env.npm_lifecycle_event === 'hot'
const isWatch = process.env.npm_lifecycle_event === 'development'
const isBuild = process.env.npm_lifecycle_event === 'build'

// JS files compiling using laravel-mix and react babel presets
mix
    .react('src/front/index.js', 'dist/front')
    .react('src/back/index.js', 'dist/back')

mix.setPublicPath('dist')
    .setResourceRoot('/dist')


/** With this we can extract sass code imported in react components **/
const rulesConfig = () => {
    const rulesArray = []

    // ExtractTextPlugin breaks css HMR
    // Default behaviour is configured for vue in node_modules
    if (!isHMR) {
        rulesArray.push({
            test: /\.s[ac]ss$/,
            exclude: [], // Fix for newer versions because of webpack-merge usage behind the scenes
            loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'postcss-loader',
                        options: {

                            plugins: [
                                autoprefixer({
                                    browsers: ['ie >= 10', 'last 4 version'],
                                }),
                            ],

                        },
                    },
                    {
                        loader: 'sass-loader',
                    },
                ],
            }),
        })
    }

    return rulesArray
}
const output = () => {
    //fix for dynamic imports s
    if (!isHMR) {
        return {publicPath: 'dist/'}
    }
    return {}
}
const includeScript = (url) => {
    return `
;(function (url) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL
    document.head.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
})('` + url + `');`
}
// SASS/SCSS webpack loader rules
// Configure dev server and HMR
mix.webpackConfig({
    module: {
        rules: rulesConfig(),
    },
    plugins: [
        new ExtractTextPlugin({
            filename: '[name].css',
            allChunks: true,
        }),
    ],
    devServer: {
        hot: true, // this enables hot reload
        inline: true, // use inline method for hmr
        disableHostCheck: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        contentBase: path.resolve(__dirname, ''),
        watchOptions: {
            exclude: [
                /bower_components/,
                /node_modules/,
            ],
        },
    },
    node: {
        fs: 'empty',
        module: 'empty',
    },
    externals: {
        // require("jquery") is external and available
        //  on the global var jQuery
        'jquery': 'jQuery',
    },
    output: output(),
})
    .sourceMaps()
    // Comment this line if you want be notified on every change
    .disableNotifications()

// Apply HMR fix
// https://github.com/JeffreyWay/laravel-mix/issues/1483
Mix.listen('configReady', (webpackConfig) => {
    if (Mix.isUsing('hmr')) {
        // Remove leading '/' from entry keys
        webpackConfig.entry = Object.keys(webpackConfig.entry).reduce((entries, entry) => {
            entries[entry.replace(/^\//, '')] = webpackConfig.entry[entry]
            return entries
        }, {})

        // Remove leading '/' from ExtractTextPlugin instances
        webpackConfig.plugins.forEach((plugin) => {
            if (plugin.constructor.name === 'ExtractTextPlugin') {
                plugin.filename = plugin.filename.replace(/^\//, '')
            }
        })
    }
})

// Versioning/Cache Busting
// Version does not work in hmr mode
if (!isHMR) {
    mix.version();
}

if (isWatch) {
    mix.browserSync({
        proxy: '',
        files: [
            'dist/**/*.css',
            'dist/**/*.js',
        ],
        server: {
            baseDir: './',
        },
        socket: {
            domain: 'localhost:3000',
        },
    })
}

//clear css files in hmr mode
//include hot reload script
if (isHMR) {

    const cssLinks = [
        'dist/front/index.css'
    ]

    const jsLinks = {
        'dist/front/index.js': 'http://localhost:8080/front/index.js',
    }

    for (const cssLink of cssLinks) {
        fs.writeFileSync(cssLink, '')
    }

    for(const link in jsLinks){
        const hmrLink = jsLinks[link]

        fs.writeFileSync(link, includeScript(hmrLink))
    }

    //hot reload images
    mix.setResourceRoot('http://localhost:8080')

}