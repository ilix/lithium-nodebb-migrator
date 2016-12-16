'use strict'

const kudo = require('./kudo')
const post = require('./post.js')
const api = require('../adapters/api')
const file = require('../helpers/file')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')
const stringHelper = require('../helpers/string')
const logger = require('./logger')('service/reply')
const userMapping = require('../../tmp/userMapping.json')

let successes = 0
let failures = 0
const _repliesToSave = []

function save (message, parentTopicId, nodeId) {
  if (message.deleted) {
    logger.debug(`Skipping deleted message: ${message.id}`)
    return Promise.resolve()
  }

  let pid
  let uid = 1

  let body
  if (message.body) {
    body = message.body
    if (body.length < 10) {
      body += '<p>&nbsp;</p>'
    }
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

  return api.saveTopicReply({
    content: body
  }, parentTopicId)
    .then(saveResult => {
      logger.debug(`Saved reply: ${saveResult.payload.pid} (${saveResult.payload.tid})`)

      pid = saveResult.payload.pid
      userMapping.map(u => {
        if (u.userId === message.user_id) {
          uid = u.uid
        }
      })

      if (uid === 1) {
        logger.warn(`Post ${saveResult.payload.pid} was not mapped to a user. Legacy user id: ${message.user_id}`)
      }

      const data = {
        pid: saveResult.payload.pid,
        tid: saveResult.payload.tid,
        uid,
        timestamp: message.post_date,
        isTopic: false
      }
      return post.updatePostRelatedData(data)
      .catch(error => {
        logger.error(error)
        throw error
      })
    })
    .then(() => {
      return kudo.import({
        messageId: message.id,
        nodeId,
        pid: pid,
        votee: uid
      })
    })
    .then(() => {
      successes++
    })
    .catch(error => {
      failures++
      logger.error([`Import error`, error])

      // Resolve? Really?
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
        .then(() => {
          logger.info(`Saved ${successes} replies`)
          logger.info(`Failed to save ${failures} replies`)
        })
  }
}
