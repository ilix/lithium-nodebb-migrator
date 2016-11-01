'use strict'

const kue = require('kue')
const env = require('dotenv')
const bootstrapper = require('./bootstrapper')
const oracle = require('./lib/adapters/oracle')

const userService = require('./lib/services/user')

env.config()
bootstrapper.checkConfiguration()

const command = process.argv[2]

if (command === 'users') {
  console.log('Import users')

  let userRowNum = 1
  let userIncrement = 10
  let userCount = parseInt(process.env.USER_COUNT)

  let intervalId = null

  intervalId = setInterval(() => {
    oracle.getLithiumAccounts(userRowNum, userRowNum + userIncrement - 1)
      .then(accounts => {
        console.log(accounts)
        return userService.insert(accounts[0])
      })
      .then(result => {
        console.log('insert results', result)
      })
      .catch(error => {
        console.error(error)
      })

    userRowNum += userIncrement

    if (userRowNum > userCount) {
      clearInterval(intervalId)
      console.log('Done importing users')
    }
  }, 3000)
}

/*
 * Start queue worker(s).
 */

const queue = kue.createQueue({
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1'
  }
})
const userWorker = require('./lib/workers/user')

userWorker.start(queue)
