// TODO: take adventage of https://nodejs.org/api/util.html#util_util_promisify_original
// after migration to Node 8
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

function saveFile (path, content) {
  return fs.openAsync(path, 'w')
    .tap((fd) => {
      return fs.writeAsync(fd, content)
    })
    .then((fd) => {
      return fs.closeAsync(fd)
    })
}

/**
 * Read the file paths from the supplied directory.
 */
function readDir (dir) {
  return fs.readdirAsync(dir)
    .map(fileName => {
      let filePath = path.join(dir, fileName)

      // if it's a directory we scan it too recursively, otherwise we just add it
      return fs.statAsync(filePath)
        .then(stat => stat.isDirectory() ? readDir(filePath) : filePath)
    })
    .reduce((a, b) => a.concat(b), [])
}

function validateMigrationNames (migrations, lastMigrationName, targetMigrationName) {
  if (lastMigrationName &&
    !migrations.find(migration => lastMigrationName === migration.name)) {
    throw Error('Migration name ' + lastMigrationName + ' not found')
  }
  if (targetMigrationName &&
    !migrations.find(migration => targetMigrationName === migration.name)) {
    throw Error('Migration name ' + targetMigrationName + ' not found')
  }
}

function mapMigrationFile (migrationFile) {
  let migration = path.parse(migrationFile)
  let name = migration.name.replace(/\.[^/.]+$/, '')
  let id = name.split('-')[0]
  let file = migration.base

  return {
    id,
    name,
    file
  }
}

/**
 * Read the update migration files from the supplied directory.
 * Provide lastMigrationName to start from.
 * Provide targetMigrationName to get the migration files up to the given one.
 * Returns an array of migration objects in desired order.
 */
function readMigrationDirUp (migrationDir, lastMigrationName, targetMigrationName) {
  return readDir(migrationDir)
    .then(migrationFiles => migrationFiles.sort((a, b) => a > b))
    .then(migrationFiles => migrationFiles.map(mapMigrationFile))
    .tap(migrations => validateMigrationNames(migrations, lastMigrationName, targetMigrationName))
    .then(migrations => {
      // Filter migration objects
      return migrations.filter(migration => {
        return (lastMigrationName ? migration.name > lastMigrationName : true) &&
          (targetMigrationName ? migration.name <= targetMigrationName : true)
      })
    })
}

/**
 * Read the downgrade migration files from the supplied directory.
 * Provide lastMigrationName to start from.
 * Provide targetMigrationName to get the migration files up to the given one.
 * Returns an array of migration objects in desired order.
 */
function readMigrationDirDown (migrationDir, lastMigrationName, targetMigrationName) {
  return readDir(migrationDir)
    .then(migrationFiles => migrationFiles.sort((a, b) => a < b))
    .then(migrationFiles => migrationFiles.map(mapMigrationFile))
    .tap(migrations => validateMigrationNames(migrations, lastMigrationName, targetMigrationName))
    .then(migrations => {
      // Filter migration objects
      return migrations.filter(migration => {
        return (lastMigrationName ? migration.name <= lastMigrationName : false) &&
          (targetMigrationName ? migration.name >= targetMigrationName : true)
      })
    })
}

module.exports = {
  saveFile,
  readDir,
  readMigrationDirUp,
  readMigrationDirDown
}
