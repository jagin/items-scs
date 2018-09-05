function replace (str, data) {
  data = data || {}

  Object.keys(data).forEach(function (key) {
    str = str.replace(new RegExp('{{' + key + '}}'), data[key])
  })

  return str
}

module.exports = function (str, options) {
  options = options || {}

  return replace(str, options.hash)
}
