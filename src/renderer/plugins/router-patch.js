export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp.$router
  let programmatic = false

  ;(['push', 'replace', 'go', 'back', 'forward']).forEach(methodName => {
    const method = router[methodName]
    router[methodName] = (...args) => {
      programmatic = true
      method.apply(router, args)
    }
  })

  router.beforeEach((to, from, next) => {
    // name is null for reload or initial load
    if (from.name === null || programmatic) {
      next()
    } else {
      next(false)
    }
    programmatic = false // clear flag
  })
})
