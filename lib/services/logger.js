'use strict'

const chalk = require('chalk')
const moment = require('moment')
const inspect = require('util').inspect
const levels = ['none', 'error', 'warn', 'info', 'debug']

function logLevel (level) {
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error'
  return levels.indexOf(level) <= levels.indexOf(process.env.LOG_LEVEL)
}

function time () {
  return chalk.blue(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]`)
}

function parseMessages (messages) {
  return messages
    .map(arg => {
      if (typeof arg === 'object' || Array.isArray(arg)) {
        return inspect(arg, {
          showHidden: true,
          depth: null,
          showProxy: true,
          maxArrayLength: null
        })
      }
      return `${arg}`
    })
    .join(' | ')
}

function debug (component) {
  if (!logLevel('debug')) { return }
  component = chalk.gray(`[${component}]`)
  const messages = parseMessages(Array.from(arguments).slice(1))
  console.log(`${time()} ${component} ${chalk.gray(messages)}`)
}

function info (component) {
  if (!logLevel('info')) { return }
  component = chalk.white(`[${component}]`)
  const messages = parseMessages(Array.from(arguments).slice(1))
  console.info(`${time()} ${component} ${chalk.white(messages)}`)
}

function warn (component) {
  if (!logLevel('warn')) { return }
  component = chalk.yellow(`[${component}]`)
  const messages = parseMessages(Array.from(arguments).slice(1))
  console.warn(`${time()} ${component} ${chalk.yellow(messages)}`)
}

function error (component, error) {
  if (!logLevel('error')) { return }
  component = chalk.red(`[${component}]`)
  if (error.message) {
    const msg = chalk.red(`${error.message}\n\t${error.stack}`)
    console.error(`${time()} ${component} ${msg}`)
  } else {
    console.error(`${time()} ${component} ${error}`)
  }
}

module.exports = (component) => {
  return {
    debug: debug.bind(null, component),
    info: info.bind(null, component),
    warn: warn.bind(null, component),
    error: error.bind(null, component)
  }
}
