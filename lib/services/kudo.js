'use strict'

const vote = require('../services/vote')
const mongo = require('../adapters/mongo')
const mysql = require('../adapters/mysql')

const moment = require('moment')

const userMapping = require('../../tmp/userMapping.json')

function importKudo (kudo, meta) {
  let voter
  userMapping.map(u => {
    if (u.userId === kudo.target_group3_id) {
      voter = u.uid
    }
  })
  const timestamp = moment(kudo.row_version)
  return vote.add({
    pid: meta.pid,
    voter,
    votee: meta.votee,
    timestamp: timestamp.format('x')
  })
}

module.exports = {
  import: meta => {
    return mysql.getKudos(meta.nodeId, meta.messageId)
      .then(kudos => {
        if (kudos && kudos.length) {
          return kudos.reduce((chain, kudo) => chain.then(() => importKudo(kudo, meta)), Promise.resolve())
        }
      })
  }
}