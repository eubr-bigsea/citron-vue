ExtractTextPlugin = require('extract-text-webpack-plugin');

var PROD = JSON.parse(process.env.PROD_ENV || '0')

module.exports = {
  entry: './app/main',
  devtool: 'source-map',
  output: {
    filename: PROD ? 'bundle.min.js' : 'bundle.js'
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.common.js'
    }
  },
  module: {
    loaders: [
    {
        test: /\.vue$/,
        loader: 'vue-loader',
    },
    { test: /\.css$/, loader: "style-loader!css-loader" },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }, 
    {
      test: /\.html$/,
      loader: 'raw'
    },
    { //ver https://github.com/sporritt/jsPlumb/issues/314
        test: require.resolve('jsplumb'),
        loaders: [
          'imports?this=>window',
          'script'
        ]
      },
      {
          test: /\.s[a|c]ss$/,
          loader: 'style!css!sass' /*ExtractTextPlugin.extract('css!sass', {publicPath: '../'})*/
      },
      { 
        test: /\.(jpe?g|gif|png|eot|svg|woff2|ttf|woff)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000&name=./public/[hash].[ext]',
        exclude: '/node_modules/'
      }, // inline base64 URLs for <=10k images, direct URLs for the rest
    ]
  },
  vue: {
    loaders: {
        scss: 'style!css!sass'
    }
  },
  plugins: [
      new ExtractTextPlugin('public/style.css', {
          allChunks: true
      })
  ]
}
