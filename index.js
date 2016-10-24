'use strict'

const env = require('dotenv')
const bootstrapper = require('./bootstrapper')
const oracle = require('./lib/adapters/oracle')

const userService = require('./lib/services/user')

env.config()
bootstrapper.checkConfiguration()

const command = process.argv[2]

if (command === 'users') {
  console.log('Import users')

  let userCount = parseInt(process.env.USER_COUNT)

  oracle.getLithiumAccounts(userCount)
    .then(accounts => {
      return userService.insert(accounts[0])
    })
    .then(result => {
      console.log('insert results', result)
    })
    .catch(error => {
      console.error(error)
    })
}
