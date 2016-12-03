'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

const _topicsToSave = []
const _messageTopicMapping = []

function save (message, categoryId) {
  let body
  if (message.body) {
    body = message.body
  } else {
    body = `!!! Lithium import message: message2.body is empty, probably an attachment-only post. Subject: "${message.subject}"`
  }

  // TODO: Do something better about too short subjects?
  let subject = message.subject
  if (message.subject.length < 10) {
    subject = subject + '          '
  }

  return api.saveTopic({
    cid: categoryId,
    title: subject,
    content: body
  })
    .then(saveResult => {
      console.log('Saved topic', saveResult.payload.postData.tid)
      _messageTopicMapping.push({
        messageId: message.id,
        topicId: saveResult.payload.topicData.tid
      })

      return saveResult
    })
    .catch(error => {
      console.log('Import error', message)
      return Promise.resolve()
    })
}

function importTopicsForNode (nodeId, categoryId) {
  return mysql.getMessagesThatAreTopics(nodeId)
    .then(messages => {
      return messages.reduce((chain, message) => chain.then(() => save(message, categoryId)), Promise.resolve())
    })
}

module.exports = {
  process: (nodeId, cid) => {
    const nodeCategoryMapping = require('../../tmp/nodeCategoryMapping.json')
    return nodeCategoryMapping.reduce((chain, nodeAndCategory) =>
      chain.then(() =>
        importTopicsForNode(nodeAndCategory.nodeId, nodeAndCategory.categoryId)), Promise.resolve())
      .then(() => {
        file.mkdirIfNotExists('./tmp')
        return file.saveJson(_messageTopicMapping, './tmp/messageTopicMapping.json')
      })
  }
}
