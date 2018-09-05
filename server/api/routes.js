const Handlers = require('./handlers')

module.exports = [
  { method: 'GET', path: '/api/items', config: Handlers.Items.find },
  { method: 'GET', path: '/api/items/{id}', config: Handlers.Items.findById },
  { method: 'POST', path: '/api/items', config: Handlers.Items.create },
  { method: 'PUT', path: '/api/items/{id}', config: Handlers.Items.update },
  { method: 'DELETE', path: '/api/items/{id}', config: Handlers.Items.remove }
]
