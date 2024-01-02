const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      builderOptions: {
        extraResources: ['src'],
        appId: 'Lan4.com',
        mac: {
          icon: 'src/assets/app_icon.icns'
        }
      },
    }
  },
  pages: {
    home: 'src/pages/home/main.js',
    lan: 'src/pages/lan/main.js'
  },
})
