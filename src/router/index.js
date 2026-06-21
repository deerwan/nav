import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'

// NullRoute - 不渲染任何内容，App.vue 负责所有视图渲染
// 路由仅用于 URL 状态管理（分类选择、设置页开关等）
const NullRoute = { render: () => h('span', { style: 'display:none' }) }

const routes = [
  {
    path: '/',
    name: 'home',
    component: NullRoute
  },
  {
    path: '/settings',
    name: 'settings',
    component: NullRoute,
    meta: { overlay: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
