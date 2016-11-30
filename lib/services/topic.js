'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

const _topicsToSave = []
const _messageTopicMapping = []

const myQueue = function () {
  setInterval(() => {
    if (_topicsToSave.length && !_topicsToSave[0].saving) {
      _topicsToSave[0].saving = 1
      api.saveTopic(_topicsToSave[0].payload)
        .then(result => {
          _messageTopicMapping.push({
            messageId: _topicsToSave[0].id,
            topicId: result.payload.topicData.tid
          })
          _topicsToSave.splice(0, 1)
        })
        .catch(nope => {
          console.error('nope', nope)
        })
    }
  }, 10)
}()

function saveMessageTopicMapping () {
  file.mkdirIfNotExists('./tmp')
  return file.saveJson(_messageTopicMapping, './tmp/messageTopicMapping.json')
}

function resolveWhenQueueIsEmpty() {
  return new Promise((resolve, reject) => {
    setInterval(() => {
      console.log('# topics left to import:', _topicsToSave.length)
      if (!_topicsToSave.length) {
        return saveMessageTopicMapping()
          .then(() => {
            return resolve()
          })
      }
    }, 1000)
  })
}

function importTopicsForNode (nodeId, categoryId) {
  return new Promise((resolve, reject) => {
    const work = []
    mysql.getMessagesThatAreTopics(nodeId)
    .then(messages => {
      messages.map(message => {
        let body = '(TODO: Do something about empty contents.)'
        if (message.body) {
          body = message.body
        }

        let subject = '(TODO: Do something about short titles)'
        if (message.subject.length > 2) {
          subject = message.subject
        }

        _topicsToSave.push({
          id: message.id,
          payload: {
            cid: categoryId,
            title: subject,
            content: body
          }
        })
      })

      resolve()
    })
    .catch(error => {
      console.error('Error in importTopicsForNode', error)
      reject(error)
    })
  })
}

function importTopicsForNodeAndCategory (nodeAndCategory) {
  const p = []
  p.push(importTopicsForNode(nodeAndCategory.nodeId, nodeAndCategory.categoryId))

  return Promise.all(p)
    .then(values => {
      return Promise.resolve(values)
    })
    .catch(error => {
      return Promise.reject(error)
    })
}

module.exports = {
  processReplies: () => {
    return Promise.resolve()
  },
  processTopics: (nodeId, cid) => {
    const work = []
    const nodeCategoryMapping = require('../../tmp/nodeCategoryMapping.json')

    nodeCategoryMapping.map(nodeAndCategory => {
      work.push(importTopicsForNodeAndCategory(nodeAndCategory))
    })

    // Wait for the crude queue to finish.
    work.push(resolveWhenQueueIsEmpty())

    return Promise.all(work)
      .catch(error => {
        logger.error('processTopics', error)
      })
  }
}
