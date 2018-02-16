var compose = require('redux').compose

function ducksMiddleware(ducks) {
  var middlewares = Object.keys(ducks)
    .map(function(key) {
      return ducks[key].middleware
    })
    .filter(function(x) {
      return x
    })

  if (middlewares.length > 0) {
    return function(store) {
      var chain = middlewares.map(function(middleware) {
        return middleware(store)
      })
      return function(next) {
        return compose.apply(null, chain)(next)
      }
    }
  }

  return function() {
    return function(next) {
      return next
    }
  }
}

module.exports = ducksMiddleware
