'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

const _repliesToSave = []

function save (message, parentTopicId) {
  if (message.deleted) {
    console.log('Skipping deleted message', message.id)
    return Promise.resolve()
  }

  let body = '(TODO: Do something about empty contents.)'
  if (message.body) {
    body = message.body
  }

  return api.saveTopicReply({
    content: body
  }, parentTopicId)
    .then(saveResult => {
      console.log('Saved topic reply', saveResult.payload.pid, saveResult.payload.tid)
      return saveResult
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
