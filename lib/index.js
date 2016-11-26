'use strict'

const env = require('dotenv')
const oracle = require('./adapters/oracle')
const userService = require('./services/user')

env.config()

const logger = require('./services/logger')('lib/index')

module.exports = {
  jsonUsers: () => {
    logger.info('users from json')
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
          return userService.insert(accounts[0])
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