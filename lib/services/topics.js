'use strict'

const api = require('../adapters/api')
const mysql = require('../adapters/mysql')

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

module.exports = {
  importMessagesForNode: (nodeId, cid) => {
    return mysql.getMessagesThatAreTopics(nodeId)
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
            cid: cid,
            title: subject,
            content: body
          }))
        })

        return Promise.all(saving)
      })
  }
}
