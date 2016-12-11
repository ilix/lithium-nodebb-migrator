'use strict'

let DB

const env = require('dotenv')
const MongoClient = require('mongodb').MongoClient
const logger = require('../services/logger')('adapters/mongo')

env.config()

/*
 * Sets up connection and stores in DB.
 */
function connect () {
  logger.debug('mongo.connect()')

  return new Promise((resolve, reject) => {
    if (DB) {
      resolve()
    }

    MongoClient.connect(process.env.MONGODB, (err, db) => {
      if (!err) {
        DB = db
        resolve()
      }

      reject()
    })
  })
}

/*
 * Close connection.
 */
function disconnect () {
  logger.debug('mongo.disconnect()')

  if (DB) {
    DB.close()
  }
}

/*
 * Takes objects (array) and saves.
 */
function insert (object) {
  logger.debug('mongo.insert()')

  if (!object._key) {
    // Not inserting empty object.
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    connect()
      .then(() => {
        DB.collection('objects').insert(object, (error, result) => {
          if (error) {
            reject(error)
          }

          resolve(result)
        })
      })
      .catch(e => {
        logger.error(e)
        reject(e)
      })
      .then(() => disconnect)
  })
}

/*
 * Find all objects of type.
 * eg. findAll('user')
 */
function findAll (match) {
  logger.debug('mongo.findAll()', match)

  return new Promise((resolve, reject) => {
    connect()
      .then(() => {
        DB
          .collection('objects').find(match)
          .toArray((err, docs) => {
            resolve(docs)
          })
      })
      .catch(e => {
        logger.error(e)
        reject(e)
      })
      .then(() => disconnect)
  })
}

function update (match, diff) {
  logger.debug('mongo.update()', match, diff)

  return new Promise((resolve, reject) => {
    connect()
      .then(() => {
        DB.collection('objects')
          .updateOne(match, { $set: diff }, (error, result) => {
            if (error) {
              logger.error(`Error: ${error.message} when trying to update ${match} with ${diff}`)
              reject(error)
            }

            resolve()
          })
      })
  })
}

function upsert (object, match) {
  return this.findAll(match)
    .then(result => {
      if (result[0]) {
        return this.update(match, object)
      }
      return this.insert(object)
    })
    .catch(error => Promise.reject(error))
}

module.exports = {
  findAll,
  insert,
  update,
  upsert
}
