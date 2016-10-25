'use strict'

const mongo = require('../adapters/mongo')

module.exports = {
  /*
   * Takes an array of users and imports them.
   */
  insert: function (users) {
    let nextUid = 1

    return mongo
      .findAll('global')
      .then(global => {
        // NOTE: The global object holds counters for user id:s etc.
        //       It should be updated after import.

        nextUid = global[0].nextUid
        console.log(`set nextUid to ${global[0].nextUid}`)

        return mongo.findAll('user:')
      })
      .then(existingUsers => {
        let itemsToSave = []
        users.map(user => {
          nextUid++

          console.log(`Going to import ${user.displayName} as user:${nextUid}`)

          // user:n
          itemsToSave.push({
              _key: `user:${nextUid}`,
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
              uid: nextUid,
              'vimla-nodebbId': user.accountId
          })

          // username:uid
          itemsToSave.push({
            _key: 'username:uid',
            value: user.displayName,
            score: nextUid
          })

          // userslug:uid
          itemsToSave.push({
            _key: 'userslug:uid',
            value: user.displayName,
            score: nextUid
          })

          // users:joindate
          itemsToSave.push({
            _key: 'users:joindate',
            value: `${nextUid}`,
            score: 1476975723710
          })

          // SSO id link object
          let ssoName_uid = {
            _key: `${process.env.SSO_NAME}:uid`
          }
          ssoName_uid[user.accountId] = nextUid
          if (user.accountId != null) {
            itemsToSave.push(ssoName_uid)
          }
        })

        console.log(`Ready to save ${itemsToSave.length} items to mongo`)
        return mongo.insert(itemsToSave)
      })
      .then(() => {
        console.log('Going to update global with nextUid')
        return mongo.update({'_key': 'global'}, {'nextUid': nextUid})
      })
      .catch(e => {
        console.log('ERROR', e)
      })
  }
}
