const Promise = require('bluebird')
const path = require('path')
const helpers = require('./helpers')

/*
 * promiseSerial resolves Promises sequentially.
 * @example
 * const urls = ['/url1', '/url2', '/url3']
 * const funcs = urls.map(url => () => promise(url))
 *
 * promiseSerial(funcs)
 *   .then(console.log)
 *   .catch(console.error)
 */
const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
  Promise.resolve([]))

exports.add = function (migrationName) {
  const id = new Date().valueOf().toString()
  const name = migrationName.replace(/\s+/g, '-').toLowerCase()
  const migration = {
    id,
    name: `${id}-${name}`
  }
  const template =
  'exports.up = function (db) {\n' +
  '  return Promise.resolve()\n' +
  '}\n' +
  '\n' +
  'exports.down = function (db) {\n' +
  '  return Promise.resolve()\n' +
  '}\n'

  return helpers.saveFile(path.resolve(__dirname, `./scripts/${migration.name}.js`), template)
    .then(() => {
      return migration
    })
}

exports.init = function (db) {
  if (process.env.NODE_ENV === 'production') {
    return Promise.reject(new Error('Database initialization is not permitted in production'))
  }

  return db.listCollections().toArray()
    .then(collections => {
      return promiseSerial(collections.map(collection => () =>
        collection.name.indexOf('system.') === -1 ? db.collection(collection.name).drop() : db.collection(collection.name).remove()))
    })
    .then(() => db.collection('migrations').createIndex({ name: 1 }, { unique: true }))
}

exports.status = function (db) {
  return db.collection('migrations').findOne({ name: { $ne: 'lock' } }, {sort: {name: -1}})
    .then(migration => {
      migration = migration || {}
      return db.collection('migrations').findOne({ name: 'lock' }).then(lock => {
        migration.lock = !!lock
        return migration
      })
    })
}

exports.lock = function (db) {
  return db.collection('migrations').findOne({ name: 'lock' })
    .then(lock => {
      if (lock) {
        throw new Error('Database migration locked')
      }
      return db.collection('migrations').insertOne({ name: 'lock' })
    })
}

exports.unlock = function (db) {
  return db.collection('migrations').findOneAndDelete({ name: 'lock' })
}

exports.up = function (db, lastMigration, targetMigration) {
  return helpers.readMigrationDirUp(path.resolve(__dirname, './scripts'), lastMigration, targetMigration)
    .then(migrations => {
      return promiseSerial(migrations.map(migration => () => {
        return require(`./scripts/${migration.name}`).up(db)
          .then(() => {
            return db.collection('migrations').insertOne({name: migration.name})
          })
          .then(() => migration)
      }))
    })
}

exports.down = function (db, lastMigration, targetMigration) {
  return helpers.readMigrationDirDown(path.resolve(__dirname, './scripts'), lastMigration, targetMigration)
    .then(migrations => {
      return promiseSerial(migrations.map(migration => () => {
        return require(`./scripts/${migration.name}`).down(db)
          .then(() => {
            return db.collection('migrations').findOneAndDelete({name: migration.name})
          })
          .then(() => migration)
      }))
    })
}
