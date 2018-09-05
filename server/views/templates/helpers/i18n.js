const i18next = require('i18next')

module.exports = function (key, options) {
  return i18next.t(key, options.hash)
}
