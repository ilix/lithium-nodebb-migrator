'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')

const userMapping = require('../../tmp/userMapping.json')

const _topicsToSave = []
const _messageTopicMapping = []

function save (message, categoryId, nodeId) {
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

  // TODO: Do something better about too short subjects?
  let subject = message.subject
  if (message.subject.length < 10) {
    subject = subject + '          '
  }

  const topic = {
    cid: categoryId,
    title: subject,
    content: body
  }

  return api.saveTopic(topic)
    .then(saveResult => {
      console.log('Saved topic', saveResult.payload.postData.tid)
      _messageTopicMapping.push({
        nodeId: nodeId,
        messageId: message.id,
        topicId: saveResult.payload.topicData.tid
      })

      let uid = 1
      userMapping.map(u => {
        console.log('check', u.userId, message.user_id)
        if (u.userId === message.user_id) {
          uid = u.uid
        }
      })

      return Promise.all([
        mongo.update({
          _key: `topic:${saveResult.payload.topicData.tid}`
        }, {
          uid: uid
        }),
        mongo.update({
          _key: `post:${saveResult.payload.topicData.tid}`,
          tid: saveResult.payload.topicData.tid
        }, {
          uid: uid
        }),
      ])
    })
    .catch(error => {
      console.error('Import error', error)
      return Promise.resolve()
    })
}

function importTopicsForNode (nodeId, categoryId) {
  return mysql.getMessagesThatAreTopics(nodeId)
    .then(messages => {
      return messages.reduce((chain, message) => chain.then(() => save(message, categoryId, nodeId)), Promise.resolve())
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
