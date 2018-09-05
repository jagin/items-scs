const Handlers = require('./handlers')

module.exports = [
  { method: 'GET', path: '/items/{lang}', config: Handlers.items },
  { method: 'GET', path: '/items/{lang}/{id}', config: Handlers.item },
  { method: 'GET', path: '/items/{lang}/partials/latests', config: Handlers.partials.latests },
  { method: 'GET', path: '/items/{lang}/partials/menu', config: Handlers.partials.menu }
]
