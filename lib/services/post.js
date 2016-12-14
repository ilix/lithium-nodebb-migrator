'use strict'

const mongo = require('../adapters/mongo')
const logger = require('./logger')('service/post')

function setTopicTime ({pid, tid, uid, timestamp, isTopic}) {
  const match = {
    _key: `topic:${tid}`
  }
  const diff = {
    lastposttime: timestamp
  } 
  if (isTopic) {
    diff.uid = uid
    diff.timestamp = timestamp
  }
  return mongo.update(match, diff)
}

function setPostTime ({pid, tid, uid, timestamp}) {
  const match = {
    _key: `post:${pid}`,
    tid: tid
  }
  const diff = {
    uid: uid,
    timestamp: timestamp
  }
  return mongo.update(match, diff)
}

function updateUser ({uid, timestamp, isTopic}) {
  const match = {
    _key: `user:${uid}`
  }
  const diff = {
    postcount: 1
  }
  if (isTopic) {
    diff.topiccount = 1
  }

  return mongo.findAll(match)
    .then(r => {
      if (!r || r.length === 0) {
        logger.error(`User ${uid} not found when updating post meta data.`)
        return Promise.reject()
      }

      const user = r[0]
      if (isTopic) {
        diff.topiccount += user.topiccount
      }
      diff.postcount += user.postcount
      if (timestamp > user.lastposttime) {
        user.lastposttime = timestamp
      }

      return mongo.update(match, diff)
    })
}

function updateUserPosts ({uid, pid, timestamp}) {
  return mongo.upsert(
    {
      _key: `uid:${uid}:posts`,
      value: `${pid}`,
      score: timestamp
    },
    {
      _key: `uid:${uid}:posts`,
      value: `${pid}`
    }
  )
}

function updateUserTopics ({uid, tid, timestamp}) {
  return mongo.upsert(
    {
      _key: `uid:${uid}:topics`,
      value: `${tid}`,
      score: timestamp
    },
    {
      _key: `uid:${uid}:topics`,
      value: `${tid}`
    }
  )
}

module.exports = {
  updatePostRelatedData: (data) => {
    return setTopicTime(data)
      .then(() => {
        return setPostTime(data)
      })
      .then(() => {
        return updateUser(data)
      })
      .then(() => {
        return updateUserPosts(data)
      })
      .then(() => {
        if (data.isTopic) {
          return updateUserTopics(data)
        } else {
          return Promise.resolve()
        }
      })
  }
}
