'use strict'

const http = require('http')
const logger = require('../services/logger')('adapters/api')

function get (path) {
  return request (path, 'GET')
}

function post (path, body) {
  return request (path, 'POST', body)
}

function request (path, method, body) {
  const options = {
    host: process.env.API_HOST,
    path: `/api/v1/${path}`,
    method: method,
    headers: {
      '_uid': 1,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN}`
    }
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, response => {
      let str = ''

      response.on('data', chunk => {
        str += chunk
      })

      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(JSON.parse(str))
        } else {
          reject(response.statusMessage)
        }
      })
    })

    if (method === 'POST') {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

module.exports = {
  saveUser: user => {
    return post('users', user)
  }
}
