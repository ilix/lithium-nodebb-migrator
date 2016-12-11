'use strict'

const mongo = require('../adapters/mongo')
const logger = require('./logger')('service/vote')

function updateOrSetPostVotes (_key, value) {
  const match = { _key, value }

  return mongo.findAll(match)
    .then(postVotes => {
      const postVote = {
        _key,
        value,
        score: 1
      }
      
      if (postVotes.length) {
        postVote.score += postVotes[0].score
      }

      return mongo.upsert(postVote, match)
    })
    .catch(error => {
      logger.error(error)
      throw error
    })
}

function updateOrSetMemberUpvotesOnPost (_key, memberId) {
  const match = { _key }
  memberId = `${memberId}`

  return mongo.findAll(match)
    .then(upvotes => {
      const upvote = {
        _key,
        members: []
      }

      if (upvotes.length) {
        if (upvotes[0].members.indexOf(memberId) > -1) {
          logger.debug(`Member ${memberId} already upvoted ${_key}`)
          return Promise.resolve()
        }

        upvote.members = upvotes[0].members
      }

      upvote.members.push(memberId)
      return mongo.upsert(upvote, match)
    })
    .catch(error => {
      logger.error(error)
      throw error
    })
}

function upvotePost (pid) {
  const match = {
    _key: `post:${pid}`
  }
  return mongo.findAll(match)
  .then(posts => {
    if (!posts.length) {
      return Promise.reject(`Could not find post ${pid} when upvoting.`)
    }

    const post = posts[0]
    const update = {
      upvotes: 1
    }

    if (post.upvotes) {
      update.upvotes += post.upvotes
    }

    return mongo.update(match, update)
  })
  .catch(error => {
    logger.error(error)
    throw error
  })
}

function reputeUser (uid) {
  const match = {
    _key: `user:${uid}`
  }
  return mongo.findAll(match)
  .then(users => {
    if (!users.length) {
      return Promise.reject(`Could not find user ${uid} when increasing reputation.`)
    }

    logger.debug(`Kudo user ${users[0].username} (${uid}) +1`)
    const user = users[0]
    const update = {
      reputation: 1
    }

    if (user.reputation) {
      update.reputation += user.reputation
    }

    return mongo.update(match, update)
  })
  .catch(error => {
    logger.error(error)
    throw error
  })
}

module.exports = {
  add: (meta) => {
    const o = {
      _key: `uid:${meta.voter}:upvote`,
      value: `${meta.pid}`,
      score: meta.timestamp
    }
    const m = {
      _key: `uid:${meta.voter}:upvote`,
      value: `${meta.pid}`
    }
    return mongo.upsert(o, m)
      .then(() => {
        return updateOrSetMemberUpvotesOnPost(`pid:${meta.pid}:upvote`, meta.voter)
      })
      .then(() => {
        return upvotePost(meta.pid)
      })
      .then(() => {
        return reputeUser(meta.votee)
      })
      .then(() => {
        return updateOrSetPostVotes(`uid:${meta.votee}:posts:votes`, meta.pid)
      })
      .catch(error => {
        logger.error(error)
        throw error
      })
  }
}
