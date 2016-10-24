'use strict'

let DB

const env = require('dotenv')
const MongoClient = require('mongodb').MongoClient

env.config()

/*
 * Sets up connection and stores in DB.
 */
function connect () {
  console.log('mongo.connect()')

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
  console.log('mongo.disconnect()')

  if (DB) {
    DB.close()
  }
}

/*
 * Takes objects (array) and saves.
 */
function insert (objects) {
  console.log('mongo.insert()')

  return new Promise((resolve, reject) => {
    connect()
      .then(() => {
        DB.collection('objects').insertMany(objects, (error, result) => {
          if (error) {
            reject(error)
          }

          resolve(result)
        })
      })
      .catch(e => {
        console.error(e)
        reject(e)
      })
      .then(() => disconnect)
  })
}

/*
 * Find all objects of type.
 * eg. findAll('user')
 */
function findAll (type) {
  console.log('mongo.findAll()', type)
  const regex = new RegExp(`${type}.*`)

  return new Promise((resolve, reject) => {
    connect()
      .then(() => {
        DB
          .collection('objects').find({'_key': regex})
          .toArray((err, docs) => {
            resolve(docs)
          })
      })
      .catch(e => {
        console.error(e)
        reject(e)
      })
      .then(() => disconnect)
  })
}

function update (match, diff) {
  console.log('mongo.update()', match, diff)

  return new Promise((resolve, reject) => {
    connect()
      .then(() => {
        DB.collection('objects')
          .updateOne(match, { $set: diff }, (error, result) => {
            if (error) {
              reject(error)
            }

            resolve()
          })
      })
  })
}

module.exports = {
  findAll,
  insert,
  update
}
