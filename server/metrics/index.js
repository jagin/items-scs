/**
 * @module 'metrics'
 * @description
 * Configurable plugin for collecting and serving application metrics.
 */

const Joi = require('joi')
const Prometheus = require('prom-client')
const Routes = require('./routes')

const defaultOptions = {
  ignorePaths: [
    '/.well-known'
  ],
  defaultMetricsTimeout: 5000
}

const optionsSchema = {
  ignorePaths: Joi.array().items(Joi.string()).default(defaultOptions.ignorePaths),
  defaultMetricsTimeout: Joi.number().default(defaultOptions.defaultMetricsTimeout)
}

const internals = {
  metrics: {
    http: {
      requests: {
        duration: new Prometheus.Summary({
          name: 'http_request_duration_milliseconds',
          help: 'request duration in milliseconds',
          labelNames: ['method', 'path', 'status']
        }),
        buckets: new Prometheus.Histogram({
          name: 'http_request_buckets_milliseconds',
          help: 'request duration buckets in milliseconds. Bucket size set to 500 and 2000 ms to enable apdex calculations with a T of 300ms',
          labelNames: ['method', 'path', 'status'],
          buckets: [ 500, 2000 ]
        })
      }
    },
    default: Prometheus.collectDefaultMetrics
  },

  init: function (options) {
    internals.options = Joi.attempt(options || {}, optionsSchema)
  },

  duration: function (start) {
    const diff = process.hrtime(start)
    return Math.round((diff[0] * 1e9 + diff[1]) / 1000000)
  },

  observeRequest: function (request) {
    const path = request.path ? request.path.toLowerCase() : ''

    if (request.response && !internals.options.ignorePaths.some(ignorePath => path.startsWith(ignorePath))) {
      const method = request.method.toLowerCase()
      const statusCode = request.response.statusCode
      const responseDuration = internals.duration(request.metrics.start)

      internals.metrics.http.requests.duration
        .labels(method, path, statusCode)
        .observe(responseDuration)

      internals.metrics.http.requests.buckets
        .labels(method, path, statusCode)
        .observe(responseDuration)
    }
  },

  observeDefault: function () {
    return internals.metrics.default({ timeout: internals.options.defaultMetricsTimeout })
  }
}

module.exports = {
  name: 'metrics',

  register (server, options) {
    let observeDefaultInterval

    internals.init(options)

    server.events.on('start', request => {
      observeDefaultInterval = internals.observeDefault()
    })

    server.events.on('stop', request => {
      clearInterval(observeDefaultInterval)
    })

    server.ext('onRequest', (request, h) => {
      request.metrics = { start: process.hrtime() }
      return h.continue
    })

    server.ext('onPreResponse', (request, h) => {
      internals.observeRequest(request)
      return h.continue
    })

    server.route(Routes)
  }
}
