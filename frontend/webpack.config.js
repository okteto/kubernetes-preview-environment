const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const srcPath = path.join(__dirname, 'src');

module.exports = {
  context: srcPath,
  mode: 'development',
  target: 'web',
  entry: ['./index.jsx'],
  output: {
    filename: 'app.[contenthash].js',
    path: path.join(__dirname, '/dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css'],
    modules: [
      path.resolve(path.join(__dirname, '/node_modules')),
      path.resolve(srcPath)
    ]
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/i,
      include: srcPath,
      use: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      ]
    }, {
      test: /\.css$/i,
      include: srcPath,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.(png|jpg|gif|ico)$/i,
      type: 'asset/resource',
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      favicon: path.join(srcPath, 'assets/images/favicon.png')
    })
  ],
  devServer: {
    port: 80,
    host: '0.0.0.0',
    hot: true,
    client: {
      webSocketURL: 'wss://0.0.0.0:443/ws'
    },
    allowedHosts: 'all',
    watchFiles: ['src/**/*'],
    proxy: {
      '/api': 'http://movies-api:8080'
    }
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
};
