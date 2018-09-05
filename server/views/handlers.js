const Joi = require('joi')

module.exports.items = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    const items = await itemsRepo.find().then(items => ({ items }))

    return h.view('items', items)
  }
}

module.exports.item = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    const params = request.params
    const item = await itemsRepo.findById(params.id).then(item => ({ item }))

    return h.view('item', item)
  },
  validate: {
    params: {
      lang: Joi.string().min(2),
      id: Joi.string().hex().required()
    }
  }
}

module.exports.partials = {
  latests: {
    handler: async function (request, h) {
      const itemsRepo = request.server.methods.Database.Repository.Items
      const items = await itemsRepo.find().then(items => ({ items }))

      return h.view('partials/latests', items, { layout: false })
    }
  },

  menu: {
    handler: async function (request, h) {
      const config = request.server.settings.app
      const scs = request.query.scs

      return h.view('partials/menu', { scs, active: scs === config.scs }, { layout: false })
    },
    validate: {
      query: {
        scs: Joi.string().required().valid(['home', 'items', 'account'])
      }
    }
  }
}
