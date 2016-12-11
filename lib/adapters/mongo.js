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
      return resolve()
    }

    MongoClient.connect(process.env.MONGODB, (error, db) => {
      if (!error) {
        DB = db
        return resolve()
      }

      logger.error('Error in mongo.connect()', error)
      return reject()
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
          // Super special case for sso id
          if (object._key === 'nodebb:uid') {
            return resolve(result)
          }

          if (error) {
            logger.error('Error in mongo.insert()', error.message)
            return reject(error)
          }

          return resolve(result)
        })
      })
      .catch(error => {
        throw error
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
        logger.error('Error in mongo.findAll()', match, e)
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
              logger.error(`Error ${error.message} in mongo.update()`, match, diff)
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
    .catch(error => {
      logger.error(`Error ${error.message} in mongo.upsert()`, object, match)
      return Promise.reject(error)
    })
}

module.exports = {
  findAll,
  insert,
  update,
  upsert
}
