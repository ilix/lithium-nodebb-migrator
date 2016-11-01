'use strict'

const logger = require('../services/logger')('adapters/api')

function setUserSalt (userSalt) {
  logger.info('set user salt', userSalt)
}

module.exports = {
  setUserSalt
}
