'use strict'

const mysql = require('mysql')
const logger = require('../services/logger')('adapters/mysql')

let _connection

function connect () {
  return new Promise((resolve, reject) => {
    if (_connection) {
      return resolve(_connection)
    }

    _connection = mysql.createConnection({
      host     : '127.0.0.1',
      user     : 'root',
      password : 'meow',
      database : 'lithium'
    })
    
    console.log('connect')
    
    _connection.connect(error => {
      if (error) {
        reject(error)
      } else {
        resolve(_connection)
      }
    })
  })
}

function query (sql) {
  return new Promise((resolve, reject) => {
    connect()
      .then(connection => {
        connection.query(sql, (error, rows, fields) => {
          if (error) {
            reject(error)
          }
        
          resolve(rows)
        })
      })
      .catch(error => {
        reject(error)
      })
  })
}

function querySingle (sql) {
  return query(sql)
    .then(result => {
      if (!result || !result.length) {
        return {}
      }

      return result[0]
    })
}

module.exports = {
  getMessages: parentId => {
    return query(`
      SELECT *
      FROM lithium.message2
      WHERE 1 = 1
        AND parent_id = ${parentId}
        AND deleted = 0
      ORDER BY post_date ASC
    `)
  },
  getMessagesThatAreReplies: (nodeId, parentId) => {
    return query(`
      SELECT *
      FROM lithium.message2
      WHERE 1 = 1
        AND node_id = ${nodeId}
        AND parent_id = ${parentId}
        AND parent_id != id 
    `)
    .then(queryResults => {
      return queryResults
    })
    .catch(e => {
      logger.error(e)
      throw e
    })
  },
  getMessagesThatAreTopics: nodeId => {
    return query(`
      SELECT *
      FROM lithium.message2
      WHERE 1 = 1
        AND node_id = ${nodeId}
        AND parent_id = id
    `)
    .then(queryResults => {
      return queryResults
    })
    .catch(e => {
      logger.error(e)
      throw e
    })
  },
  getNodes: parentId => {
    return query(`
      SELECT *
      FROM lithium.nodes
      WHERE 1 = 1
        AND type_id = 3
        AND depth = 4
        AND hidden = 0
        AND deleted = 0
        AND hidden_ancestor = 0
      ORDER BY position
    `)
  },
  getUserByEmail: email => {
    return querySingle(`
      SELECT *
      FROM lithium.users
      WHERE 1 = 1
        AND email_lower = '${email.toLowerCase()}'
    `)
  },
  getUserBySSOId: ssoId => {
    return querySingle(`
      SELECT *
      FROM lithium.users
      WHERE 1 = 1
        AND sso_id = ${ssoId}
    `)
  },
  getKudos: (nodeId, messageId, userId) => {
    return query(`
      SELECT *
      FROM lithium.tag_events_score_message
      WHERE 1 = 1
        AND target_id = ${messageId}
        AND target_group2_id = ${nodeId}
    `)
  }
}
