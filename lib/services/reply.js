'use strict'

const kudo = require('./kudo')
const api = require('../adapters/api')
const file = require('../helpers/file')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')

const userMapping = require('../../tmp/userMapping.json')

const _repliesToSave = []

function save (message, parentTopicId, nodeId) {
  if (message.deleted) {
    console.log('Skipping deleted message', message.id)
    return Promise.resolve()
  }

  let pid
  let uid = 1

  let body
  if (message.body) {
    body = message.body
  } else {
    body = `!!! Lithium import message: message2.body is empty, probably an attachment-only post. Subject: "${message.subject}"`
  }

  return api.saveTopicReply({
    content: body
  }, parentTopicId)
    .then(saveResult => {
      console.log('Saved topic reply', saveResult.payload.pid, saveResult.payload.tid)

      pid = saveResult.payload.pid
      userMapping.map(u => {
        if (u.userId === message.user_id) {
          uid = u.uid
        }
      })

      return Promise.all([
        mongo.update({
          _key: `post:${saveResult.payload.pid}`
        }, {
          uid: uid,
          timestamp: message.post_date
        }),
      ])
    })
    .then(() => {
      return kudo.import({
        messageId: message.id,
        nodeId,
        pid: pid,
        votee: uid
      })
    })
    .catch(error => {
      console.log('Import error', error, message)
      return Promise.resolve()
    })
}

function importTopicsForParentNode (messageAndTopic) {
  return mysql.getMessagesThatAreReplies(messageAndTopic.nodeId, messageAndTopic.messageId)
    .then(messages => {
      return messages.reduce((chain, message) => chain.then(() => save(message, messageAndTopic.topicId, messageAndTopic.nodeId)), Promise.resolve())
    })
}

module.exports = {
  process: (nodeId, cid) => {
    const messageReplyMapping = require('../../tmp/messageTopicMapping.json')
    return messageReplyMapping.reduce((chain, messageAndTopic) =>
      chain.then(() =>
        importTopicsForParentNode(messageAndTopic)), Promise.resolve())
  }
}
