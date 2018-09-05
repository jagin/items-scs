module.exports = {
  name: 'database-repository',
  dependencies: 'database',
  register (server, options) {
    const itemsRepo = require('./items')(server.db)

    server.method(itemsRepo)
  }
}
