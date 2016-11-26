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
  console.log('do request')
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
        console.log('END', response.statusCode)
        if (response.statusCode === 201) {
          resolve(JSON.parse(str))
        }
      })
    })

    if (method === 'POST') {
      console.log('do POST', body)
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
