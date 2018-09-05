const Handlers = require('./handlers')

module.exports = [
  { method: 'GET', path: '/items/assets/{param*}', config: Handlers.public }
]
