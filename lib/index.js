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
    return mongo.upsert({
      "_key": "plugins:active",
      "value": "nodebb-theme-vimla",
      "score": 0
    }, {
      _key: 'plugins:active',
      value: 'nodebb-theme-persona'
    })
    .then(() => {
      mongo.update({
        _key: 'config'
      }, {
        'theme:id': 'nodebb-theme-vimla',
        'defaultLang': 'sv',
        'allowGuestSearching': 1
      })
    })
    .then(() => {
      const items = [
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-write-gravatar",
        "score": 1
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-beep",
        "score": 2
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-write-api",
        "score": 3
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-widget-vimla",
        "score": 4
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-widget-search-bar",
        "score": 5
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-composer-redactor",
        "score": 6
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-question-and-answer",
        "score": 7
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-bug-reports",
        "score": 8
      },
      // {
      //   "_key": "plugins:active",
      //   "value": "nodebb-plugin-vimla-ranking",
      //   "score": 9
      // },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-vimla-avatars",
        "score": 10
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-dbsearch",
        "score": 11
      },
      {
        "_key": "plugins:active",
        "value": "nodebb-plugin-sso-oauth",
        "score": 12
      },
      {
        "_key": "uid:1:tokens",
        "members": [
          process.env.API_TOKEN
        ]
      },
      {
        "_key": "widgets:topic.tpl",
        "sidebar": "[]",
        "header": "[]",
        "footer": "[]"
      },
      {
        "_key": "widgets:category.tpl",
        "sidebar": "[]",
        "header": "[]",
        "footer": "[]"
      },
      {
        "_key": "widgets:categories.tpl",
        "sidebar": "[{\"widget\":\"vimlaSenaste\",\"data\":{\"numTopics\":\"\",\"title\":\"Senaste inläggen\",\"container\":\"<div class=\\\"panel panel-default\\\"><div class=\\\"panel-heading\\\"><h3 class=\\\"panel-title\\\">{{title}}</h3></div><div class=\\\"panel-body\\\">{{body}}</div></div>\"}},{\"widget\":\"vimlaUnread\",\"data\":{\"numTopics\":\"\",\"title\":\"Olästa inlägg\",\"container\":\"<div class=\\\"panel panel-default\\\"><div class=\\\"panel-heading\\\"><h3 class=\\\"panel-title\\\">{{title}}</h3></div><div class=\\\"panel-body\\\">{{body}}</div></div>\"}},{\"widget\":\"vimlaKudos\",\"data\":{\"numUsers\":\"\",\"minReputation\":\"\",\"title\":\"Topplista användare\",\"container\":\"<div class=\\\"panel panel-default\\\"><div class=\\\"panel-heading\\\"><h3 class=\\\"panel-title\\\">{{title}}</h3></div><div class=\\\"panel-body\\\">{{body}}</div></div>\"}}]",
        "header": "[]",
        "footer": "[]",
        "motd": "[{\"widget\":\"search-bar\",\"data\":{\"hideOnTopic\":\"on\",\"hideOnUnread\":\"on\",\"hideOnRecent\":\"on\",\"hideOnPopular\":\"on\",\"hideOnTags\":\"on\"}}]"
      }
    ]
    const writeToken = {
      "_key": "writeToken:uid"
    }
    writeToken[process.env.API_TOKEN] = 1
    items.push(writeToken)

    return items.reduce((chain, item) => 
      chain.then(() => 
        mongo.insert(item)), Promise.resolve())
    })
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
