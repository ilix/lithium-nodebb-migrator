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
          saving.push(api.saveTopic({
            cid: cid,
            title: message.subject,
            content: message.body
          }))
        })

        return Promise.all(saving)
      })
  }
}
