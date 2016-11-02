'use strict'

const logger = require('./lib/services/logger')('bootstrapper')

module.exports = {
  checkConfiguration: function () {
    const self = this

    logger.info('Checking configuration:')
    Object.keys(self.keys).map(key => {
      logger.info(key, `${process.env[key]}`)

      if (self.keys[key].required && !process.env[key] && !process.env.VIMLA_API_NOCHECK_VARS) {
        throw new Error(`Environment variable ${key} is required but not set.`)
      }
    })

    logger.info()
  },
  keys: {
    LOG_LEVEL: {},
    MONGODB: {
      required: true
    },
    ORACLE_CLIENT: {
      required: true
    },
    ORACLE_HOST: {},
    ORACLE_DATABASE: {},
    ORACLE_USER: {
      required: true
    },
    ORACLE_PASSWORD: {
      required: true
    },
    REDIS_HOST: {},
    SSO_NAME: {
      required: true
    },
    USER_COUNT: {
      required: true
    }
  },
  print: function (data) {}
}
