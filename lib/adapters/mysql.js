'use strict'

const mysql = require('mysql')

function connect () {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host     : '127.0.0.1',
      user     : 'root',
      password : 'meow',
      database : 'lithium'
    })
    
    console.log('connect')
    
    connection.connect(error => {
      if (error) {
        reject(error)
      } else {
        resolve(connection)
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
  })
}

module.exports = {
  getMessages: (parentId) => {
    return query(`SELECT * FROM lithium.message2 WHERE parent_id = ${parentId}`)
  },
  getMessagesThatAreTopics: (nodeId) => {
    return query(`SELECT * FROM lithium.message2 WHERE node_id = ${nodeId} and parent_id = id`)
  },
  getNodes: (parentId) => {
    return query(`SELECT * FROM lithium.nodes WHERE type_id = 3 and depth = 4`)
    // return query(`SELECT * FROM lithium.nodes WHERE parent_node_id = ${parentId} and type_id = 3 and depth = 4`)
  }
}
