exports.healthCheck = {
  handler: function (request, h) {
    return h.response().code(200)
  }
}
