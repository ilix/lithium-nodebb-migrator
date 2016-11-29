'use strict'

const api = require('./adapters/api')
const mongo = require('./adapters/mongo')
const mysql = require('./adapters/mysql')
const oracle = require('./adapters/oracle')
const topicService = require('./services/topic')
const userService = require('./services/user')

const fs = require('fs')

const env = require('dotenv')
env.config()

const logger = require('./services/logger')('lib/index')

module.exports = {
  /*
   * A helper for setting up the nodebb-plugin-write-api with correct api token.
   */
  init: () => {
    const pluginActive = {
      "_id": "5839a0899750568d4954b00b",
      "_key": "plugins:active",
      "value": "nodebb-plugin-write-api",
      "score": 9
    }
    const writeToken = {
      "_id": "5839a10e9750568d4954b011",
      "_key": "writeToken:uid"
    }
    writeToken[process.env.API_TOKEN] = 1
    const uidToken = {
      "_id": "5839a10e9750568d4954b012",
      "_key": "uid:1:tokens",
      "members": [
        process.env.API_TOKEN
      ]
    }

    return Promise.all(
      [
        mongo.insert(pluginActive),
        mongo.insert(writeToken),
        mongo.insert(uidToken)
      ]
    )
  },
  clean: () => {
    return Promise.all([
      api.deleteCategory(1),
      api.deleteCategory(2),
      api.deleteCategory(3),
      api.deleteCategory(4)
    ])
  },
  clean2: () => {
    const cleaning = []
    let i = 1
    while (i < 100) {
      cleaning.push(api.deleteCategory(i))
      i++
    }

    return Promise.all(cleaning)
  },
  /*
   * Import users from json.
   */
  jsonUsers: () => {
    logger.info('users from json')
    return new Promise((resolve, reject) => {
      // Loop through all the files in the temp directory
      fs.readdir('./users', (error, files) => {
        if (error) {
          logger.error( "Could not list user json files", error)
          process.exit(1)
        }

        let users = []

        files.map(file => {
          if (file.indexOf('.json') > -1) {
            const contents = require(`../users/${file}`)
            users.push(contents)
          }
        })

        userService.processJsonUsers(users)
          .then(() => {
            resolve()
          })
      })
    })
  },
  /*
   * Import users from Oracle.
   */
  oracleUsers: () => {
    logger.info('Import users')

    let userRowNum = 1
    let userIncrement = 500
    let userCount = parseInt(process.env.USER_COUNT)

    let intervalId = null

    intervalId = setInterval(() => {
      oracle.getLithiumAccounts(userRowNum, userRowNum + userIncrement - 1)
        .then(accounts => {
          return userService.processOracleUsers(accounts[0])
        })
        .catch(error => {
          console.error(error)
        })

      userRowNum += userIncrement

      if (userRowNum > userCount) {
        clearInterval(intervalId)
        logger.info('Done importing users')
      }
    }, 3000)
  },
  /*
   * Import categories (nodes in lithium)
   */
  nodes: () => {
    console.log('nodes...')
    
  }
}
