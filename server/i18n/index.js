const Hoek = require('hoek')
const Boom = require('boom')
const i18next = require('i18next')
const i18nBackend = require('i18next-node-fs-backend')
const acceptLanguageParser = require('accept-language-parser')

module.exports = {
  name: 'i18n',

  register (server, options) {
    const i18nDefaults = {
      supportedLngs: ['en'],
      queryName: 'lang',
      cookieName: 'lang',
      pathName: 'lang',
      backend: {
        // path where resources get loaded from
        loadPath: './server/locales/{{lng}}/{{ns}}.json',
        // path to post missing resources
        addPath: './server/locales/{{lng}}/{{ns}}.missing.json',
        // jsonIndent to use when storing json files
        jsonIndent: 2
      }
    }
    const i18nOptions = Hoek.applyToDefaults(i18nDefaults, options || {})

    function detectLanguage (language) {
      return i18nOptions.supportedLngs.indexOf(language) > -1 ? language : undefined
    }

    function detectLanguageFromPath (request) {
      return detectLanguage(request.params[i18nOptions.pathName])
    }

    function detectLanguageFromQuery (request) {
      return detectLanguage(request.query[i18nOptions.queryName])
    }

    function detectLanguageFromCookies (request) {
      return detectLanguage(request.state[i18nOptions.cookieName])
    }

    function detectLanguageFromHeaders (request) {
      return acceptLanguageParser.pick(i18nOptions.supportedLngs, request.headers['accept-language'])
    }

    function changeLanguage (lng) {
      return new Promise((resolve, reject) => {
        i18next.changeLanguage(lng, (err, t) => {
          if (err) reject(err)

          resolve(t)
        })
      })
    }

    i18next
      .use(i18nBackend)
      .init(i18nOptions)

    server.ext('onPreAuth', async function (request, h) {
      let lng

      request.i18n = i18next

      // Detect language in order: path, query, cookies, header
      lng = detectLanguageFromPath(request)
      if (request.params[i18nOptions.pathName] && !lng) {
        return Boom.notFound('No language available for ' + request.params[i18nOptions.pathName])
      }
      lng = lng || detectLanguageFromQuery(request)
      lng = lng || detectLanguageFromCookies(request)
      lng = lng || detectLanguageFromHeaders(request)
      lng = lng || i18nOptions.supportedLngs[0]
      i18nOptions.lng = lng

      await changeLanguage(lng)

      return h.continue
    })

    server.ext('onPreResponse', function (request, h) {
      const response = request.response

      // Check to see if the response is a view
      if (response.variety === 'view') {
        // Initialize if context is not defined
        response.source.context = response.source.context || {}

        response.source.context.i18n = i18next
      }

      return h.continue
    })
  }
}
