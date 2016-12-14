'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')
const oracle = require('../adapters/oracle')
const timeHelper = require('../helpers/time')
const logger = require('./logger')('services/user')

let _users = []
let failures = 0
const _userMapping = []

function saveUserObject (userObject) {
  let uid = 0

  // Edge-case, username is '-'
  if (userObject.username === '-') {
    userObject.username = `${userObject.fullname.toLowerCase().split(' ').join('')}`
    logger.info(`Reformatted illegal username for ${userObject.username}`)
  }

  if (!userObject.email) {
    logger.info(`User email is null; ${userObject.username}. Skipping.`)
    return Promise.resolve()
  }

  const at = userObject.email.indexOf('@')
  if (at === -1) {
    logger.info(`User "${userObject.username}" lacks proper email (${userObject.email}). Skipping.`)
    return Promise.resolve()
  }

  return api.saveUser(userObject)
    .then(r => {
      uid = r.payload.uid
      return Promise.all([
        mongo.upsert({
          _key: 'users:joindate',
          value: `${uid}`,
          score: userObject.joindate
        }, {_key: 'users:joindate', value: `${uid}`}),
        mongo.upsert({
          joindate: userObject.joindate
        }, {_key: `user:${uid}`})
      ])
    })
    .then(() => {
      return mysql.findUser({
        email: userObject.email,
        ssoId: userObject.sso_id,
        username: userObject.username
      })
    })
    .then(legacyUser => {
      if (!legacyUser.id) {
        failures++
        logger.error(`Could not find user ${userObject.email} / ${userObject.sso_id} / ${userObject.username}`)
        return
      } else {
        const ssoId = legacyUser.sso_id
        const userId = legacyUser.id
        _userMapping.push({
          uid: uid,
          email: userObject.email.toLowerCase(),
          ssoId: ssoId,
          userId: userId
        })
      }
    })
    .then(() => {
      let ssoName_uid = {}

      if (userObject['vimla-nodebbId'] != null) {
        ssoName_uid._key = `${process.env.SSO_NAME}:uid`
        ssoName_uid[userObject['vimla-nodebbId']] = uid

        return mongo.upsert(ssoName_uid, ssoName_uid)
      } else {
        return Promise.resolve()
      }
    })
    .catch(error => {
      failures++
      logger.error([`Failed to save user ${userObject.email} in api.`, error])
    })
}

function loadUsersFromOracle () {
  return new Promise((resolve, reject) => {
    let userRowNum = 1
    let userIncrement = 100 // Can't seem to bypass this.
    let intervalId = null

    intervalId = setInterval(() => {
      oracle.getLithiumAccounts(userRowNum, userRowNum + userIncrement - 1)
        .then(accounts => {
          if (!accounts || !accounts[0].length) {
            clearInterval(intervalId)
            logger.info(`Done! A total of ${_users.length} users are now loaded into memory.`)
            return resolve()
          }

          _users = _users.concat(accounts[0])
          logger.debug(`${_users.length} users are loaded into memory so far.`)
        })
        .catch(error => {
          logger.error(error)
          return reject(error)
        })

      userRowNum += userIncrement
    }, 1000)
  })
}

function save (user) {
  logger.debug('Process user', user.email, user.displayName)
  
  const joindate = timeHelper.convertChronoToUnixDate(user.id)
  return saveUserObject({
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
  }, '')
}

module.exports = {
  processJsonUsers: function (users) {
    return new Promise((resolve, reject) => {
      users.map(user => {
        _users.push(user)
      })

      return _users.reduce((chain, user) => 
        chain.then(() => 
          saveUserObject(user)), Promise.resolve())
        .then(() => {
          logger.info(`Saved ${_userMapping.length} users`)
          logger.info(`Failed to save ${failures} users`)

          file.mkdirIfNotExists('./tmp')
          return file.saveJson(_userMapping, './tmp/userMapping.json')
        })
    })
  },
  processUserArray: users => {
    return users.reduce((chain, user) => 
      chain.then(() => 
        save(user)), Promise.resolve())
      .then(() => {
        logger.info(`Saved ${_userMapping.length} users`)
        logger.info(`Failed to save ${failures} users`)

        file.mkdirIfNotExists('./tmp')
        return file.saveJson(_userMapping, './tmp/userMapping.json')
      })
  },
  process: function () {
    return loadUsersFromOracle()
      .then(() => {
        // At this point, we have all users in memory.
        return _users.reduce((chain, user) => 
          chain.then(() => 
            save(user)), Promise.resolve())
          .then(() => {
            logger.info(`Saved ${_userMapping.length} users`)
            logger.info(`Failed to save ${failures} users`)

            file.mkdirIfNotExists('./tmp')
            return file.saveJson(_userMapping, './tmp/userMapping.json')
          })
      })
  }
}
