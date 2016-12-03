'use strict'

const api = require('../adapters/api')
const mongo = require('../adapters/mongo')
const oracle = require('../adapters/oracle')
const timeHelper = require('../helpers/time')
const logger = require('./logger')('services/user')

let _users = []
const userMapping = []

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
      console.log('saveUserResult', r)
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
      // TODO: Lookup user in lithium mysql db
      return Promise.resolve()
    })
    .then(() => {
      let ssoName_uid = {}

      if (userObject['vimla-nodebbId'] != null) {
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
            console.log(`Done! ${_users.length} users are now loaded into memory`)
            return resolve()
          }

          _users = _users.concat(accounts[0])
          console.log(`${_users.length} users are now loaded into memory`)
        })
        .catch(error => {
          console.error(error)
          return reject(error)
        })

      userRowNum += userIncrement
    }, 1000)
  })
}

function save (user) {
  logger.info('Process user', user.email, user.displayName)
  
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
  }, )
}

module.exports = {
  processJsonUsers: function (users) {
    let work = []
    users.map(user => {
      work.push(saveUserObject(user))
    })
    return Promise.all(work)
  },
  process: function () {
    return loadUsersFromOracle()
      .then(() => {
        // At this point, we have all users in memory.
        return _users.reduce((chain, user) => 
          chain.then(() => 
            save(user)), Promise.resolve())
      })
  }
}
