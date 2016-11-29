'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')

      // .then(nodeSaveResult => {
      //   const nodeMessageImporting = []
      //   nodeSaveResult.map(n => {
      //     nodeMessageImporting.push(topics.importMessagesForNode(n.legacyId, n.payload.cid))
      //   })

      //   return Promise.all(nodeMessageImporting)
      // })

function saveTopic (topic, id) {
  let tid = 0
  return api.saveTopic(topic)
    .then(savedTopic => {
      tid = savedTopic.payload.tid
      return mysql.getMessages(id)
    })
    .then(messages => {
      const saving = []

      messages.map(message => {
        saving.push(saveTopicReply({
          content: message.body
        }, tid))
      })

      return Promise.all(saving)
    })
}

function handle (m) {
  const p = []
console.log('do something', m)
  p.push(mysql.getMessagesThatAreTopics(m.nodeId)
    .then(messages => {
      const saving = []

      messages.map(message => {

        let body = '(TODO: Do something about empty contents.)'
        if (message.body) {
          body = message.body
        }

        let subject = '(TODO: Do something about short titles)'
        if (message.subject.length > 2) {
          subject = message.subject
        }

        saving.push(api.saveTopic({ // TODO: Change to saveTopic to use above declared function.
          cid: m.categoryId,
          title: subject,
          content: body
        }))
      })
      return Promise.all(p)
    }))

  return Promise.all(p)
}

module.exports = {
  processReplies: () => {
    return Promise.resolve()
  },
  processTopics: (nodeId, cid) => {
    const nodeCategoryMapping = require('../../tmp/nodeCategoryMapping.json')

    console.log(nodeCategoryMapping)
    const work = []
    nodeCategoryMapping.map(m => {
      console.log()
      work.push(handle(m))
    })

   
    return Promise.all(work)
  }
}
