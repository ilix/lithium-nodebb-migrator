'use strict'

const app = require('./lib/index')
const bootstrapper = require('./bootstrapper')
const logger = require('./lib/services/logger')('main')

bootstrapper.checkConfiguration()

const userService = require('./lib/services/user')
const replyService = require('./lib/services/reply')
const topicService = require('./lib/services/topic')
const categoryService = require('./lib/services/category')

let exitCode = 0
const _command = process.argv[2]

if (!_command) {
  logger.error('No command specified.')
  process.exit(1)
}

const r = () => {
  switch (_command) {
    case 'clean':
      return app.clean()
    case 'init':
      return app.init()
    case 'jsonUsers':
      return app.jsonUsers()
    case 'users':
      return userService.process()
    case 'initCategories':
      return categoryService.init()
    case 'nodes':
      return categoryService.process()
    case 'topics':
      return topicService.process()
    case 'replies':
      return replyService.process()
    default:
      return Promise.reject((`Command "${_command}" is not declared.`))
  }
}

r()
  .then(() => {
    logger.info(`Command '${_command}' completed!`)
  })
  .catch(error => {
    exitCode = 1
    if (error.message) {
      logger.error(`Error: ${error.message}`)
    }

    if (error.statusMessage) {
      logger.error(`Error: ${error.statusCode} ${error.statusMessage}`)
    }

    logger.error(`Command '${_command}' resulted in error.`)
  })
  .then(() => {
    console.log()
    process.exit(exitCode)
  })
