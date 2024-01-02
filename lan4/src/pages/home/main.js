import Vue from 'vue'
import Home from './Home.vue'
import vuetify from '@/plugins/vuetify'

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(Home)
}).$mount('#app')
