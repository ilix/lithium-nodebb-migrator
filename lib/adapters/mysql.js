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

module.exports = {
  getMessages: (parentId) => {
    return query(`
      SELECT *
      FROM lithium.message2
      WHERE 1 = 1
        AND parent_id = ${parentId}
        AND deleted = 0
      ORDER BY post_date ASC
    `)
  },
  getMessagesThatAreReplies: (nodeId) => {
    return query(`
      SELECT *
      FROM lithium.message2
      WHERE 1 = 1
        AND parent_id = ${nodeId}
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
  getMessagesThatAreTopics: (nodeId) => {
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
  getNodes: (parentId) => {
    return query(`
      SELECT *
      FROM lithium.nodes
      WHERE 1 = 1
        AND type_id = 3
        AND depth = 4
    `)
  }
}
