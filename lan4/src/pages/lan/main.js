import Vue from 'vue'
import Lan from './Lan.vue'
import vuetify from '@/plugins/vuetify'

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(Lan)
}).$mount('#app')
