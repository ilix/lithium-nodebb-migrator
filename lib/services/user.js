'use strict'

const api = require('../adapters/api')
const timeHelper = require('../helpers/time')
const mongo = require('../adapters/mongo')
const logger = require('./logger')('services/user')

function saveUserObject (userObject) {
  // TODO: Actually save the user using the API adapters
  // TODO: Then, save an sso object using the mongo adapter

  return api.saveUser(userObject)
    .then(r => {
      console.log('saved user?', r)
    })
    .catch(error => {
      logger.error(`Failed to save user ${user.id} ${user.username} in api`, error)
    })
}

module.exports = {
  /*
   * Handles an array of users.
   */
  process: function (users) {
    return new Promise((resolve, reject) => {
      users.map(user => {

        const joindate = timeHelper.convertChronoToUnixDate(user.id)

        logger.info('Process user', user.email, user.displayName)
        saveUserObject({
          username: user.displayName,
          userslug: user.displayName,
          email: user.email,
          'joindate': joindate,
          'lastonline': 1476975723710,
          'picture': '',
          'fullname': `${user.firstName} ${user.lastName}`,
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
