const Promise = require('bluebird')
const Hoek = require('hoek')
const MongoDB = require('mongodb')
const MongoClient = MongoDB.MongoClient

const mongoClientDefaults = {
  promiseLibrary: Promise
}

exports.connect = function (databaseUrl, options) {
  options = Hoek.applyToDefaults(mongoClientDefaults, options || {})

  return MongoClient.connect(databaseUrl, options)
}

exports.ObjectId = MongoDB.ObjectID
