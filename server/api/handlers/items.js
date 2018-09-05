const Joi = require('joi')
const Boom = require('boom')

exports.find = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    const query = request.query
    const items = await itemsRepo.find({
      pagination: {
        page: query.page,
        limit: query.limit
      }
    })

    return h.response(items)
  },
  tags: ['api'],
  validate: {
    query: {
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10)
    }
  }
}

exports.findById = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    const params = request.params
    const item = await itemsRepo.findById(params.id)

    if (!item) {
      throw Boom.notFound()
    }

    return h.response(item)
  },
  tags: ['api'],
  validate: {
    params: {
      id: Joi.string().hex().required()
    }
  }
}

exports.create = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    let item = request.payload
    item = await itemsRepo.create(item)

    return h.response(item).code(201)
  },
  auth: 'jwt',
  tags: ['api'],
  validate: {
    payload: {
      name: Joi.string().min(1).max(50).required(),
      tags: Joi.array().items(Joi.string())
    }
  }
}

exports.update = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    const params = request.params
    let item = request.payload
    item = await itemsRepo.update(params.id, item)

    if (!item) {
      throw Boom.notFound()
    }

    return h.response(item)
  },
  auth: 'jwt',
  tags: ['api'],
  validate: {
    params: {
      id: Joi.string().hex().required()
    },
    payload: {
      name: Joi.string().min(1).max(50).required(),
      tags: Joi.array().items(Joi.string())
    }
  }
}

exports.remove = {
  handler: async function (request, h) {
    const itemsRepo = request.server.methods.Database.Repository.Items
    const params = request.params
    const item = await itemsRepo.remove(params.id)

    if (!item) {
      throw Boom.notFound()
    }

    return h.response(item)
  },
  auth: 'jwt',
  tags: ['api'],
  validate: {
    params: {
      id: Joi.string().hex().required()
    }
  }
}
