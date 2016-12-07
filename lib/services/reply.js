'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')

const userMapping = require('../../tmp/userMapping.json')

const _repliesToSave = []

function save (message, parentTopicId) {
  if (message.deleted) {
    console.log('Skipping deleted message', message.id)
    return Promise.resolve()
  }

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

      let uid = 1
      userMapping.map(u => {
        if (u.userId === message.user_id) {
          uid = u.uid
        }
      })

      return Promise.all([
        mongo.update({
          _key: `post:${saveResult.payload.pid}`
        }, {
          uid: uid
        }),
      ])
    })
    .catch(error => {
      console.log('Import error', message)
      return Promise.resolve()
    })
}

function importTopicsForParentNode (messageId, topicId) {
  return mysql.getMessagesThatAreReplies(messageId)
    .then(messages => {
      return messages.reduce((chain, message) => chain.then(() => save(message, topicId)), Promise.resolve())
    })
}

module.exports = {
  process: (nodeId, cid) => {
    const messageReplyMapping = require('../../tmp/messageTopicMapping.json')
    return messageReplyMapping.reduce((chain, messageAndTopic) =>
      chain.then(() =>
        importTopicsForParentNode(messageAndTopic.messageId, messageAndTopic.topicId)), Promise.resolve())
  }
}
