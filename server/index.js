require('dotenv').config()

const Glue = require('glue')
const config = require('./config').validate()

async function composeServer () {
  try {
    const server = await Glue.compose(config.manifest, { relativeTo: __dirname })

    if (config.isDevelopment) {
      server.route({ method: 'GET', path: '/', handler: function (request, h) { return h.redirect(`/items/${request.i18n.language}`) } })
    }

    if (!module.parent) {
      await server.start()
      console.log('Server is listening on ' + server.info.uri.toLowerCase())

      process.on('unhandledRejection', (err) => {
        throw err
      })
    }

    return server
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

module.exports = composeServer()
