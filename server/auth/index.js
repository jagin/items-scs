const validate = async (decoded, request) => {
  // This is a simple check that the `sub` claim
  // exists in the access token. Modify it to suit
  // the needs of your application
  if (decoded && decoded.sub) {
    return { isValid: true }
  }

  return { isValid: false }
}

module.exports = {
  name: 'auth',
  register (server, options) {
    server.auth.strategy('jwt', 'jwt', {
      key: options.jwt.key,
      verifyOptions: {
        audience: options.jwt.audience,
        issuer: options.jwt.issuer,
        ignoreExpiration: options.jwt.ignoreExpiration,
        algorithms: ['HS256']
      },
      validate
    })

    server.ext('onPreResponse', function (request, h) {
      const response = request.response

      if (request.auth && response.variety === 'view') {
        response.source.context = response.source.context || {}
        response.source.context.isAuthenticated = request.auth.isAuthenticated
        response.source.context.credentials = request.auth.isAuthenticated ? request.auth.credentials : null
      }

      return h.continue
    })

    server.auth.default({
      strategy: 'jwt',
      mode: 'optional'
    })
  }
}
