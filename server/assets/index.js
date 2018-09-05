const Routes = require('./routes')

module.exports = {
  name: 'assets',
  register (server, options) {
    server.route(Routes)
  }
}
