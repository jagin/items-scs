exports.up = function (db) {
  return db.collection('items').insertMany([{
    name: 'Item 1',
    tags: ['tag1', 'tag2']
  }, {
    name: 'Item 2',
    tags: ['tag2', 'tag3']
  }])
}

exports.down = function (db) {
  return db.collection('items').drop()
}
