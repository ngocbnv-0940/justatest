import Vue from 'vue'
import store from '~/store'
import Meta from 'vue-meta'
import routes from './routes'
import Router from 'vue-router'
import { sync } from 'vuex-router-sync'

Vue.use(Meta)
Vue.use(Router)

const routeMiddleware = resolveMiddleware(
  require.context('./middleware', false, /.*\.js$/)
)

const router = make()

sync(store, router)

export default router

/**
 * Create a new router instance.
 *
 * @return {Router}
 */
function make () {
  const router = new Router({
    scrollBehavior,
    mode: 'history',
    routes: routes.map(beforeEnter),
    // linkActiveClass: 'is-active',
    linkExactActiveClass: 'is-active'
  })

  // Register before guard.
  router.beforeEach(async (to, from, next) => {
    store.commit('setTab', to.meta.tab)
    if (!to.meta.tab) {
      store.commit('setTitle', { title: null, subtitle: null })
    }

    if (!store.getters.authCheck && store.getters.authToken) {
      try {
        await store.dispatch('fetchUser')
      } catch (e) { }
    }

    await setLayout(to)
    next()
  })

  /**
   * Add beforeEnter guard to the route.
   *
   * @param {Object} route
   * @param {Object}
   */
  function beforeEnter (route) {
    if (route.children) {
      route.children.forEach(beforeEnter)
    }

    if (!route.middleware) {
      return route
    }

    route.beforeEnter = (...args) => {
      if (!Array.isArray(route.middleware)) {
        route.middleware = [route.middleware]
      }

      route.middleware.forEach(middleware => {
        if (typeof middleware === 'function') {
          middleware(...args)
        } else if (routeMiddleware[middleware]) {
          routeMiddleware[middleware](...args)
        } else {
          throw Error(`Undefined middleware [${middleware}]`)
        }
      })
    }

    return route
  }

  // Register after hook.
  router.afterEach((to, from) => {
    router.app.$nextTick(() => {
      router.app.$loading.finish()
    })
  })

  return router
}

/**
 * Set the application layout from the matched page component.
 *
 * @param {Route} to
 */
async function setLayout (to) {
  // Get the first matched component.
  let [component] = router.getMatchedComponents({ ...to })

  if (component) {
    await router.app.$nextTick()

    if (typeof component === 'function') {
      component = await component()
    }

    // Start the page loading bar.
    if (component.loading !== false) {
      router.app.$loading.start()
    }

    // Set application layout.
    router.app.setLayout(component.layout || '')
  }
}

/**
 * @param  {Route} to
 * @param  {Route} from
 * @param  {Object|undefined} savedPosition
 * @return {Object}
 */
function scrollBehavior (to, from, savedPosition) {
  // if (to.hash) {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       resolve({ selector: to.hash })
  //     }, 500)
  //   })
  // }

  if (savedPosition) {
    return savedPosition
  }

  const [component] = router.getMatchedComponents({ ...to }).slice(-1)

  if (component && component.scrollToTop === false) {
    return {}
  }

  return { x: 0, y: 0 }
}

/**
 * @param  {Object} requireContext
 * @return {Object}
 */
function resolveMiddleware (requireContext) {
  return requireContext.keys()
  .map(file =>
    [file.replace(/(^.\/)|(\.js$)/g, ''), requireContext(file)]
  )
  .reduce((guards, [name, guard]) => (
    { ...guards, [name]: guard.default }
  ), {})
}
