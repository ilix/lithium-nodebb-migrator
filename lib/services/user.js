'use strict'

const api = require('../adapters/api')
const timeHelper = require('../helpers/time')
const mongo = require('../adapters/mongo')
const logger = require('./logger')('services/user')

function upsert (object, match) {
  return mongo.findAll(match)
    .then(result => {
      if (result[0]) {
        return mongo.update(match, object)
      }
      return mongo.insert(object)
    })
    .catch(error => logger.error)
}

function saveUserObject (userObject) {
  let uid = 0
  return api.saveUser(userObject)
    .then(r => {
      uid = r.payload.uid
      return Promise.all([
        upsert({
          _key: 'users:joindate',
          value: `${uid}`,
          score: userObject.joindate
        }, {_key: 'users:joindate', value: `${uid}`}),
        upsert({
          joindate: userObject.joindate
        }, {_key: `user:${uid}`})
      ])
    })
    .then(() => {
      let ssoName_uid = {}
      console.log('do sso')
      if (userObject['vimla-nodebbId'] != null) {
        console.log('yes')
        ssoName_uid._key = `${process.env.SSO_NAME}:uid`
        ssoName_uid[userObject['vimla-nodebbId']] = uid

        return upsert(ssoName_uid, ssoName_uid)
      } else {
        return Promise.resolve()
      }
    })
    .catch(error => {
      logger.error(`Failed to save user ${userObject.email} in api ${error}`)
    })
}

module.exports = {
  processJsonUsers: function (users) {
    users.map(user => {
      saveUserObject(user)
    })

    return Promise.resolve()
  },
  processOracleUsers: function (users) {
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
