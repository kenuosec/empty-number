import Vue from 'vue'
import App from './App.vue'//引入了App.vue
import router from './router'//引入路由设置
import './registerServiceWorker'
import './plugins/element.js'//引入ElementUI

Vue.config.productionTip = false//防止在生产环境中产生过多的log输出

// 创建一个接口和地址,定义到Vue的原型上
import axios from "axios"
Vue.prototype.$http = axios.create({
  // baseURL: "http://81.71.124.110:3000"
  baseURL: "http://localhost:3000"
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')//这里是通过$mount方法将new Vue()中的内容挂载到了一个id=app的html文件中。等同于el:'#app'的作用。
