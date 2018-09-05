const Prometheus = require('prom-client')

exports.metrics = {
  handler: function (request, h) {
    return h.response(Prometheus.register.metrics()).type(Prometheus.register.contentType)
  }
}
