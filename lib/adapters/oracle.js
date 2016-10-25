'use strict'

const oracleClient = require('oracle-client')
let client

function connect () {
  if (!client) {
    const connectionString = process.env.ORACLE_CLIENT
    console.log('oracle.connect()', connectionString)
    client = oracleClient.connect(connectionString)
  }

  return client
    .connect({
      'user': process.env.ORACLE_USER || '',
      'password': process.env.ORACLE_PASSWORD || '',
      'host': process.env.ORACLE_HOST || '',
      'database': process.env.ORACLE_DATABASE || ''
    })
    .then(conn => {
      console.log('oracle connection up')
      return conn
    })
    .catch(err => {
      throw err
    })
}

function execute (calls) {
  return connect()
    .catch(err => {
      console.log('@connection failed')
      console.error(err)

      return Promise.reject(err)
    })
    .then(conn => {
      return Promise.all(calls.map(c => {
        return c(conn)
      }))
        .then(results => {
          return conn
            .close()
            .catch(() => results)
            .then(() => results)
        })
        .catch(err => {
          console.log('@Promise chain failed')
          console.error(err)

          return conn
            .close()
            .catch(() => Promise.reject(err))
            .then(() => Promise.reject(err))
        })
    })
}

function getLithiumAccounts (begin, end) {
  console.log(`oracle.getLithiumAccounts(${begin}, ${end})`)
  const sql = `
    SELECT  *
    FROM
    (
      SELECT   q.*
              ,rownum rn
      FROM
      (
        SELECT   LITHIUM_ACCOUNT.ID
                ,LITHIUM_ACCOUNT.DISPLAY_NAME
                ,LITHIUM_ACCOUNT.FIRST_NAME
                ,LITHIUM_ACCOUNT.LAST_NAME
                ,LITHIUM_ACCOUNT.EMAIL
                ,LITHIUM_ACCOUNT.ACCOUNT_ID
        FROM LITHIUM_ACCOUNT
        ORDER BY ID
      ) q
    )
    WHERE rn BETWEEN :begin AND :end
  `
  return execute([conn => conn.execute(sql, [begin, end])])
    .then(res => res)
}

module.exports = {
  getLithiumAccounts
}
