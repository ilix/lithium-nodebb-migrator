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
      "_key": "plugins:active",
      "value": "nodebb-plugin-write-api",
      "score": 9
    }
    const themeActive = {
      "_key": "plugins:active",
      "value": "nodebb-theme-vimla",
      "score": 10
    }
    const writeToken = {
      "_key": "writeToken:uid"
    }
    writeToken[process.env.API_TOKEN] = 1
    const uidToken = {
      "_key": "uid:1:tokens",
      "members": [
        process.env.API_TOKEN
      ]
    }

    return Promise.all(
      [
        mongo.insert(pluginActive),
        mongo.insert(themeActive),
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
  /*
   * Import users from json.
   */
  jsonUsers: () => {
    logger.info('users from json')
    const users = require('../users/_users.json')
    return userService.processUserArray(users)
  }
}
