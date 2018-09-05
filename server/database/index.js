const Hoek = require('hoek')
const mongoClient = require('./mongo-client')
const migration = require('./migration')

module.exports = {
  name: 'database',

  register (server, options) {
    const mongoDbDefaults = {
      url: 'mongodb://localhost:27017',
      name: 'items-db',
      poolSize: 10
    }
    options = Hoek.applyToDefaults(mongoDbDefaults, options || {})

    return mongoClient.connect(options.url, {
      poolSize: options.poolSize
    }).then(client => {
      const db = client.db(options.name)
      return migration.lock(db)
        .then(() => migration.status(db))
        .then(migration => migration ? migration.name : null)
        .then(lastMigration => migration.up(db, lastMigration))
        .then(migrations => {
          const migrationNames = migrations.reduce((prev, curr) => prev.concat(curr.name), [])
          console.log('Database updated: ' + (migrationNames.length ? migrationNames.join(', ') : 'none'))
        })
        .then(() => migration.unlock(db))
        .then(() => {
          server.decorate('server', 'db', db)
          server.decorate('request', 'db', db)
          server.expose('db', db)
        })
    })
  }
}
