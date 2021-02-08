import Vue from 'vue'
import Router from 'vue-router'
import Active from "../views/Active.vue"
import Login from "../views/Login.vue"
import Beiwei from "../views/Beiwei.vue"
Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/',
            name: 'home',
            redirect: "/login",
            meta: {
                title: '登录'
            }
        },
        {
            path: '/active',
            name: 'active',
            component: Active
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/beiwei',
            name: 'beiwei',
            component: Beiwei
        },
        {
            path: '/test',
            component: () => import('@/views/newPage'),
            hidden: true
        },
    ]
})
