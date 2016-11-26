'use strict'

const env = require('dotenv')
const oracle = require('./adapters/oracle')
const userService = require('./services/user')

const fs = require('fs')

env.config()

const logger = require('./services/logger')('lib/index')

module.exports = {
  jsonUsers: () => {
    logger.info('users from json')
    
    var moveFrom = "/home/mike/dev/node/sonar/moveme"
    var moveTo = "/home/mike/dev/node/sonar/tome"

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
    })
  },
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
  }
}