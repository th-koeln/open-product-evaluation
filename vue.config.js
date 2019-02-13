const path = require('path')

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@':  path.resolve(__dirname, './src/views/'),
      },
    },
    /*entry: {
      app: [
        './src/views/main.js'
      ]
    }*/
  },
  css: {
    loaderOptions: {
      sass: {
        data: '@import "@/scss/variables.scss";',
      },
    },
  },
}
