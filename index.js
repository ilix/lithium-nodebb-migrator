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
  case 'jsonUsers':
    app.jsonUsers()
    break;
  case 'users':
    app.oracleUsers()
    break;
  default:
    logger.error(`Command "${command}" is not declared.`)
}
