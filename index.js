'use strict'

const app = require('./lib/index')
const bootstrapper = require('./bootstrapper')
const logger = require('./lib/services/logger')('main')

bootstrapper.checkConfiguration()

const command = process.argv[2]

if (!command) {
  logger.error('No command specified.')
  process.exit(1)
}

switch (command) {
  case 'init':
    app.init()
      .then(() => {
        console.log('nodebb-plugin-write-api should be activated now. Restart nodebb.')
        process.exit(0)
      })
    break;
  case 'jsonUsers':
    app.jsonUsers()
    break;
  case 'users':
    app.oracleUsers()
    break;
  default:
    logger.error(`Command "${command}" is not declared.`)
}
