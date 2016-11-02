'use strict'

/*
 * Responsible for saving users into NodeBB's mongodb.
 *
 * Will listen to a redis queue and try to save each item
 *   after checking if it already exists.
 */

const kue = require('kue')
const mongo = require('../adapters/mongo')
const logger = require('../services/logger')('workers/user')

function laisseSert (object, match) {
  return mongo.findAll(match)
    .then(result => {
      if (!result[0]) {
        return mongo.insert(object)
      }
    })
    .catch(error => logger.error)
}

function upsert (object, match) {
  return mongo.findAll(match)
    .then(result => {
      if (result[0]) {
        return mongo.update({'_key': object._key}, object)
      }

      return mongo.insert(object)
    })
    .catch(error => logger.error)
}

function setMeta (meta) {
  return Promise.all([
    upsert({
        _key: 'username:uid',
        value: meta.username,
        score: meta.uid
      }, {_key: 'username:uid', value: meta.username}),
    upsert({
        _key: 'userslug:uid',
        value: meta.username.toLowerCase(),
        score: meta.uid
      }, {_key: 'userslug:uid', value: meta.username}),
    upsert({
        _key: 'users:joindate',
        value: `${meta.uid}`,
        score: meta.joindate
      }, {_key: 'users:joindate', value: meta.username})
  ])
}

module.exports = {
  processJob (user) {
    let nextUid = 1

    return new Promise((resolve, reject) => {
      mongo.findAll({'_key': 'global'})
        .then(global => {
          nextUid = global[0].nextUid
          return mongo.findAll({email: user.email})
        })
        .then(result => {
          if (!result[0]) {
            nextUid++

            user.uid = nextUid
            user._key = `user:${nextUid}`

            // SSO id link object
            let ssoName_uid = {}
            if (user.accountId != null) {
              ssoName_uid._key = `${process.env.SSO_NAME}:uid`
              ssoName_uid[user.accountId] = nextUid
            }

            return Promise.all([
              laisseSert(user, {_key: user._key}),
              setMeta({
                uid: nextUid,
                joindate: user.joindate, 
                username: user.username
              }),
              upsert(ssoName_uid, ssoName_uid)
            ])
            .then(results => {
              return mongo.update({'_key': 'global'}, {'nextUid': nextUid})
            })
            .catch(error => {
              logger.error(error)
            })
          } else {
            logger.info(`user ${user.email} already in database as ${result[0].uid}`)
            
            const uid = result[0].uid
            const userUpdateFields = {
              joindate: user.joindate,
              userslug: user.userslug.toLowerCase()
            }

            return Promise.all([
              mongo.update({'_key': `user:${uid}`}, userUpdateFields),
              setMeta({
                uid: uid,
                joindate: user.joindate, 
                username: user.username
              })
            ])
          }
        })
        .then(results => {
          resolve()
          logger.debug('Updated global')
        })
        .catch(error => {
          reject(error)
          logger.error(error)
        })
    })
  },

  start (queue) {
    return queue.process('users', (job, done) => {
      return this.processJob(job.data)
        .then(() => done())
        .catch(error => console.error)
    })
  }
}
