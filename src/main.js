import Vue from "vue";
import App from "./App";
import router from "./router/index";
import store from "./lib/vue-state";

import PaperDashboard from "./plugins/paperDashboard";

import VueTouch from "vue-touch"
import VueNotify from 'vuejs-notify'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'


Vue.use(BootstrapVue)
Vue.use(VueTouch, {name: 'v-touch'})
Vue.use(PaperDashboard);
Vue.use(VueNotify,{
  styles: { 
    minWidth: 350, // default 250
    maxWidth: 450, // default 350
    width: 100 // default null
  },
})


/* eslint-disable no-new */
new Vue({
  store: store,
  router,
  render: h => h(App)
}).$mount("#app");
