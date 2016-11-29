'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

const _topicsToSave = []

const myQueue = function () {
  console.log('# # # start myQueue')
  setInterval(() => {
    if (_topicsToSave.length && !_topicsToSave[0].saving) {
      console.log('--> queue', _topicsToSave.length)
      _topicsToSave[0].saving = 1
      api.saveTopic(_topicsToSave[0])
        .then(result => {
          _topicsToSave.splice(0, 1)
          //console.log('saved', result)
        })
        .catch(nope => {
          console.error('nope', nope)
        })
    }
  }, 10)
}()

function importTopicsForNode (nodeId, categoryId) {
  console.log('importTopicsForNode', nodeId, categoryId)
  return new Promise((resolve, reject) => {
    const work = []
    mysql.getMessagesThatAreTopics(nodeId)
    .then(messages => {
      console.log('messages for', nodeId, messages.length)
      messages.map(message => {

        let body = '(TODO: Do something about empty contents.)'
        if (message.body) {
          body = message.body
        }

        let subject = '(TODO: Do something about short titles)'
        if (message.subject.length > 2) {
          subject = message.subject
        }

        // work.push(api.saveTopic({
        //   cid: categoryId,
        //   title: subject,
        //   content: body
        // }))

        _topicsToSave.push({
          cid: categoryId,
          title: subject,
          content: body
        })
      })

      return resolve()

      // return Promise.all(work)
      //   .then(values => {
      //     console.log('work for', nodeId, 'done')
      //     return Promise.resolve(values)
      //   })
      //   .catch(error => {
      //     console.log('# # error for', nodeId, 'done')
      //     return Promise.reject(error)
      //   })
    })
    .catch(error => {
      console.error('Error in importTopicsForNode', error)
      throw error
    })
  })
}

function importTopicsForNodeAndCategory (nodeAndCategory) {
  const p = []
  console.log('Handle', nodeAndCategory)
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

    return Promise.all(work)
      .then(mhm => {
        console.log('mhm', mhm)
      })
      .catch(error => {
        console.error('errrrrrrrrrr', error)
      })
  }
}
