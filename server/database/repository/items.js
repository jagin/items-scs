const MongoDB = require('mongodb')

module.exports = function (db) {
  const ObjectID = MongoDB.ObjectID
  const itemsCollection = db.collection('items')

  function findById (id, options) {
    options = options || {}

    const p = itemsCollection.findOne({ _id: ObjectID(id) })

    return p
  }

  function find (options) {
    options = options || {}
    const filter = options.filter || {}
    let p = itemsCollection.find(filter)

    if (options.sort) {
      p = p.sort(options.sort)
    }

    if (options.fields) {
      p = p.project(options.fields)
    }

    if (options.pagination) {
      const pagination = options.pagination

      p = p.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit)
    }

    return p.toArray()
  }

  function count (options) {
    options = options || {}
    const filter = options.filter || {}
    let p = itemsCollection.find(filter).count()

    return p.toArray()
  }

  function create (item, options) {
    options = options || {}

    const p = itemsCollection.insertOne(item)
      .then(result => result.ops[0])

    return p
  }

  function update (id, item, options) {
    options = options || {}

    const p = itemsCollection.findOneAndUpdate(
      { _id: ObjectID(id) },
      { $set: item },
      { returnOriginal: false }
    ).then(result => result.value)

    return p
  }

  function remove (id, options) {
    options = options || {}

    const p = itemsCollection.findOneAndDelete(
      { _id: ObjectID(id) }
    ).then(result => result.value)

    return p
  }

  return [{
    name: 'Database.Repository.Items.findById',
    method: findById,
    options: {}
  }, {
    name: 'Database.Repository.Items.find',
    method: find,
    options: {}
  }, {
    name: 'Database.Repository.Items.count',
    method: count,
    options: {}
  }, {
    name: 'Database.Repository.Items.create',
    method: create,
    options: {}
  }, {
    name: 'Database.Repository.Items.update',
    method: update,
    options: {}
  }, {
    name: 'Database.Repository.Items.remove',
    method: remove,
    options: {}
  }]
}
