'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

const _repliesToSave = []
const _messageReplyMapping = []

const myQueue = function () {
  setInterval(() => {
    if (_repliesToSave.length && !_repliesToSave[0].saving) {
      _repliesToSave[0].saving = 1
      api.saveTopicReply(_repliesToSave[0].payload, _repliesToSave[0].tid)
        .then(result => {
          // _messageReplyMapping.push({
          //   messageId: _repliesToSave[0].id,
          //   topicId: result.payload.tid
          // })
          _repliesToSave.splice(0, 1)
        })
        .catch(nope => {
          console.error('nope', nope)
        })
    }
  }, 10)
}()

// function saveMessageTopicMapping () {
//   file.mkdirIfNotExists('./tmp')
//   return file.saveJson(_messageReplyMapping, './tmp/messageReplyMapping.json')
// }

function resolveWhenQueueIsEmpty(save) {
  return new Promise((resolve, reject) => {
    setInterval(() => {
      console.log('#replies left to import:', _repliesToSave.length)
      if (!_repliesToSave.length) {
        if (save) {
          return savemessageReplyMapping()
            .then(() => {
              return resolve()
            })
        } else {
          return resolve()
        }
      }
    }, 2000)
  })
}

function cleanAndQueueMessages (messages, messageAndTopic) {
  messages.map(message => {
    let body = '(TODO: Do something about empty contents.)'
    if (message.body) {
      body = message.body
    }

    let subject = '(TODO: Do something about short titles)'
    if (message.subject.length > 2) {
      subject = message.subject
    }

    _repliesToSave.push({
      tid: messageAndTopic.topicId,
      payload: {
        content: body
      }
    })
  })
}

module.exports = {
  process: () => {
    const messageReplyMapping = require('../../tmp/messageTopicMapping.json')

    messageReplyMapping.map(messageAndTopic => {
      mysql.getMessagesThatAreReplies(messageAndTopic.messageId)
        .then(messages => {
          return cleanAndQueueMessages(messages, messageAndTopic)
        })
    })

    return resolveWhenQueueIsEmpty()
      .catch(error => {
        logger.error('processTopics', error)
      })
  }
}
