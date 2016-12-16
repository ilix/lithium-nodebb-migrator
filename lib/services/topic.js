'use strict'

const kudo = require('./kudo')
const post = require('./post.js')
const api = require('../adapters/api')
const file = require('../helpers/file')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')
const stringHelper = require('../helpers/string')
const logger = require('./logger')('service/topic')
const userMapping = require('../../tmp/userMapping.json')

let failures = 0
const _topicsToSave = []
const _messageTopicMapping = []

function save (message, categoryId, nodeId) {
  if (message.deleted) {
    logger.debug(`Skipping deleted message: ${message.id}`)
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

  if (body.indexOf('<messagetemplate markup="html" id="freeform">  <zone type="content">    <item>      <content>') > -1) {
    body.replace('<messagetemplate markup="html" id="freeform">  <zone type="content">    <item>      <content>', '')
    body.replace('</messagetemplate>', '')

    body = stringHelper.decodeHtmlSymbols(body)
  }

  while (body.indexOf('src="/t5') > -1) {
    let imgsrc = body.replace(body.substring(0, body.indexOf('/t5')), '')
    const e = imgsrc.indexOf('"')
    imgsrc = imgsrc.substring(0, e)
    let p = imgsrc.replace(imgsrc.substring(0, imgsrc.indexOf('image-id') + 9), '')
    p = p.replace(p.substring(p.indexOf('/image-size/')), '')
    p = `${process.env.IMAGE_SERVER}/image/original/${p}`
    body = body.replace(imgsrc, p)
  }

  body = stringHelper.parseLiUserTag(body)

  // TODO: Do something better about too short subjects?
  let subject = message.subject
  if (message.subject.length < 10) {
    subject = subject + '          -'
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
      logger.debug(`Saved topic: ${saveResult.payload.postData.tid} (${message.subject})`)
      _messageTopicMapping.push({
        nodeId: nodeId,
        messageId: message.id,
        topicId: saveResult.payload.topicData.tid
      })

      // Save pid since it is used further down in the chain.
      pid = saveResult.payload.topicData.tid

      // Save uid.
      userMapping.map(u => {
        let user_id = message.user_id
        if (user_id === 1909) {
          user_id = 593
        }
        if (u.userId === user_id) {
          uid = u.uid
        }
      })

      if (uid === 1) {
        logger.warn(`Topic ${saveResult.payload.postData.tid} was not mapped to a user. Legacy user id: ${message.user_id}`)
      }

      const data = {
        uid,
        pid: saveResult.payload.topicData.tid,
        tid: saveResult.payload.topicData.tid,
        timestamp: message.post_date,
        isTopic: true
      }
      return post.updatePostRelatedData(data)
      .catch(error => {
        logger.error(['Error in Promise.all in topics.save()', error])
        return Promise.reject(error)
      })
    })
    .then(() => {
      return kudo.import({
        messageId: message.id,
        nodeId: nodeId,
        pid: pid,
        votee: uid
      })
    })
    .catch(error => {
      failures++
      logger.error(['Topic import error', error])

      // Resolve? Really?
      return Promise.resolve()
    })
}

function importTopicsForNode (nodeId, categoryId) {
  return mysql.getMessagesThatAreTopics(nodeId)
    .then(messages => {
      return messages.reduce((chain, message) => chain.then(() => save(message, categoryId, nodeId)), Promise.resolve())
    })
    .catch(error => {
      logger.error([`Error in topic.importTopicsForNode(${nodeId}, ${categoryId})`, error])
    })
}

module.exports = {
  process: (nodeId, cid) => {
    const nodeCategoryMapping = require('../../tmp/nodeCategoryMapping.json')
    return nodeCategoryMapping.reduce((chain, nodeAndCategory) =>
      chain.then(() =>
        importTopicsForNode(nodeAndCategory.nodeId, nodeAndCategory.categoryId)), Promise.resolve())
      .then(() => {
        logger.info(`Saved ${_messageTopicMapping.length} topics`)
        logger.info(`Failed to save ${failures} topics`)

        file.mkdirIfNotExists('./tmp')
        return file.saveJson(_messageTopicMapping, './tmp/messageTopicMapping.json')
      })
      .catch(error => {
        logger.error(error)
      })
  }
}
