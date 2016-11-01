'use strict'

const moment = require('moment')

module.exports = {
  convertChronoToUnixDate: chrono => {
    const m = moment(chrono, 'YYYYMMDDHHmmss')
    const formattedUnixMilliseconds = m.format('x')

    return parseInt(formattedUnixMilliseconds)
  }
}