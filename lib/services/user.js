'use strict'

const kue = require('kue')
const mongo = require('../adapters/mongo')
const logger = require('./logger')('services/user')
const queue = kue.createQueue({
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1'
  }
})

function queueUserObject (object) {
  return new Promise((resolve, reject) => {
    queue.create('users', object).save(error => {
      if (error) {
        reject(error)
        return
      }

      logger.debug(`Added user to queue: ${object.email}`)
      resolve()
    })
  })
}

module.exports = {
  /*
   * Takes an array of users and adds them to queue.
   */
  insert: function (users) {
    return new Promise((resolve, reject) => {
      users.map(user => {
        queueUserObject({
          username: user.displayName,
          userslug: user.displayName,
          email: user.email,
          'joindate': 1476975723710,
          'lastonline': 1476975723710,
          'picture': '',
          'fullname': '',
          'location': '',
          'birthday': '',
          'website': '',
          'signature': '',
          'uploadedpicture': '',
          'profileviews': 0,
          'reputation': 0,
          'postcount': 0,
          'topiccount': 0,
          'lastposttime': 0,
          'banned': 0,
          'status': '',
          'vimla-nodebbId': user.accountId
        })
        .catch(error => {
          reject(error)
          logger.error(error)
        })
      })

      resolve()
    })
  }
}
