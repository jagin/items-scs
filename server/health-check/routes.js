const Handlers = require('./handlers')

module.exports = [
  { method: 'GET', path: '/items/health-check', config: Handlers.healthCheck }
]
