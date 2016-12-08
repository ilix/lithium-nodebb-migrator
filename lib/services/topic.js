'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const vote = require('./vote')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')
const stringHelper = require('../helpers/string')

const userMapping = require('../../tmp/userMapping.json')

const _topicsToSave = []
const _messageTopicMapping = []

function save (message, categoryId, nodeId) {
  if (message.deleted) {
    // console.log('Skipping deleted message', message.id)
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

  // TODO: Do something better about too short subjects?
  let subject = message.subject
  if (message.subject.length < 10) {
    subject = subject + '          '
  }

  // Replace stuff.
  subject = stringHelper.decodeHtmlSymbols(subject)

  const topic = {
    cid: categoryId,
    title: subject,
    content: body
  }

  return api.saveTopic(topic)
    .then(saveResult => {
      console.log('Saved topic', saveResult.payload.postData.tid, `(${message.subject})`)
      _messageTopicMapping.push({
        nodeId: nodeId,
        messageId: message.id,
        topicId: saveResult.payload.topicData.tid
      })

      // Save pid since it is used further down in the chain.
      pid = saveResult.payload.topicData.tid

      // Save uid.
      userMapping.map(u => {
        if (u.userId === message.user_id) {
          uid = u.uid
        }
      })

      return Promise.all([
        mongo.update({
          _key: `topic:${saveResult.payload.topicData.tid}`
        }, {
          uid: uid,
          lastposttime: message.post_date,
          timestamp: message.post_date
        }),
        mongo.update({
          _key: `post:${saveResult.payload.topicData.tid}`,
          tid: saveResult.payload.topicData.tid
        }, {
          uid: uid,
          timestamp: message.post_date
        }),
      ])
    })
    .then(() => {
      return importKudos({
        messageId: message.id,
        nodeId: nodeId,
        pid: pid,
        tid: pid,
        votee: uid
      })
    })
    .catch(error => {
      console.error('Import error', error)
      return Promise.resolve()
    })
}

function importKudos (meta) {
  console.log('meta', meta)
  return mysql.getKudos(meta.messageId, meta.nodeId)
    .then(kudos => {
      if (kudos && kudos.length) {
        return kudos.reduce((chain, kudo) => chain.then(() => importKudo(kudo, meta)), Promise.resolve())
      }
    })
}

function importKudo (kudo, meta) {
  let voter
  userMapping.map(u => {
    if (u.userId === kudo.target_group3_id) {
      voter = u.uid
    }
  })

  return vote.add({
    pid: meta.pid,
    tid: meta.pid, 
    voter,
    votee: meta.votee,
    timestamp: kudo.tag_time * 1000
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
