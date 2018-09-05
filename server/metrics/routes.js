const Handlers = require('./handlers')

module.exports = [
  { method: 'GET', path: '/items/metrics', config: Handlers.metrics }
]
