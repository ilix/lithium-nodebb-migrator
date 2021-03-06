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
    
    logger.debug('Connect')
    
    _connection.connect(error => {
      if (error) {
        return reject(error)
      } else {
        return resolve(_connection)
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
            logger.error(['Mysql query failed', sql, error])
            return reject(error)
          }
        
          return resolve(rows)
        })
      })
      .catch(error => {
        throw error
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
    .catch(error => {
      logger.error(['Mysql.querySingle() failed', sql, error])
      return reject(error)
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
        AND root_id = ${parentId}
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
  getNodes: () => {
    return query(`
      SELECT *
      FROM lithium.nodes n
      LEFT OUTER JOIN lithium.settings s on n.node_id = s.node_id && s.param = 'board.title'
      WHERE 1 = 1
        AND n.type_id = 3
        AND n.depth >= 4
        AND n.hidden = 0
        AND n.deleted = 0
      ORDER BY position
    `)
  },
  findUser: ({email, ssoId, username}) => {
    if (!ssoId) {
      ssoId = -2
    }

    return querySingle(`
      SELECT   u.*
              ,p.nvalue AS signature
              ,(
                SELECT p2.nvalue
                FROM lithium.user_profile p2
                WHERE 1 = 1
                  AND p2.user_id = u.id
                  AND p2.param = 'profile.url_icon'
                  AND p2.nvalue NOT LIKE 'avatar:%'
              ) as picture
      FROM lithium.users u
      LEFT OUTER JOIN lithium.user_profile p ON u.id = p.user_id AND p.param = 'profile.signature'
      WHERE 0 = 1
        OR u.email_lower = '${email.toLowerCase()}'
        OR u.sso_id = ${ssoId}
        OR LCASE(u.nlogin) = '${username.toLowerCase()}'
      ORDER BY p.row_version DESC
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
  getKudos: (nodeId, messageId) => {
    return query(`
      SELECT *
      FROM lithium.tag_events_score_message
      WHERE 1 = 1
        AND target_id = ${messageId}
        AND target_group2_id = ${nodeId}
    `)
  }
}
