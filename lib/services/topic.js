'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

const _topicsToSave = []
const _messageTopicMapping = []

function save (message, categoryId) {
  let body = '(TODO: Do something about empty contents.)'
  if (message.body) {
    body = message.body
  }

  let subject = '(TODO: Do something about short titles)'
  if (message.subject.length > 2) {
    subject = message.subject
  }

  return api.saveTopic({
    cid: categoryId,
    title: subject,
    content: body
  })
    .then(saveResult => {
      console.log('Saved', saveResult.payload.postData.pid)
      _messageTopicMapping.push({
        messageId: message.id,
        topicId: saveResult.payload.topicData.tid
      })

      return saveResult
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
    const work = []
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
