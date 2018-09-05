const Routes = require('./routes')

module.exports = {
  name: 'health-check',
  register (server, options) {
    server.route(Routes)
  }
}
