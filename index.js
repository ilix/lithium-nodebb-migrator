'use strict'

const env = require('dotenv')
const bootstrapper = require('./bootstrapper')
const oracle = require('./lib/adapters/oracle')

env.config()
bootstrapper.checkConfiguration()

const command = process.argv[2]

if (command === 'users') {
  console.log('Import users')

  oracle.getLithiumAccounts(100)
    .then(accounts => {
      console.log('Got lithium accounts', accounts)
    })
    .catch(error => {
      console.error(error)
    })
}
