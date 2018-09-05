const Routes = require('./routes')

module.exports = {
  name: 'api',

  register (server, options) {
    server.route(Routes)
  }
}
