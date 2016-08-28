ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
  entry: './app/main',
  output: {
    filename: 'bundle.js'
  },
  module: {
    loaders: [
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
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract('css!sass', {publicPath: '../'})
      },
      { 
        test: /\.(jpe?g|gif|png|eot|svg|woff2|ttf|woff)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000&name=./public/[hash].[ext]',
        exclude: '/node_modules/'
      }, // inline base64 URLs for <=10k images, direct URLs for the rest
    ]
  },
  plugins: [
      new ExtractTextPlugin('public/style.css', {
          allChunks: true
      })
  ]
}
