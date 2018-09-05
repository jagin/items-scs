const Routes = require('./routes')

module.exports = {
  name: 'views',
  dependencies: 'vision',
  register (server, options) {
    const config = server.settings.app

    server.views({
      engines: {
        hbs: require('handlebars')
      },
      relativeTo: __dirname,
      path: './templates',
      layoutPath: './templates/layout',
      layout: 'default',
      isCached: config.isProduction,
      partialsPath: './templates/partials',
      helpersPath: './templates/helpers'
    })

    server.route(Routes)
  }
}
