'use strict'

const env = require('dotenv')
env.config()

const http = (process.env.API_SSL === '1') ? require('https') : require('http')

function del (path) {
  return request(path, 'DELETE')
}

function get (path) {
  return request(path, 'GET')
}

function post (path, body) {
  return request(path, 'POST', body)
}

function request (path, method, body) {
  const options = {
    host: process.env.API_HOST,
    port: process.env.API_PORT,
    path: `/api/v1/${path}`,
    method: method,
    protocol: (process.env.API_SSL === '1') ? 'https:' : 'http:',
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
          reject({
            body: body,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            path: options.path
          })
        }
      })
    })

    if (method === 'POST' || method === 'PUT') {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

module.exports = {
  deleteCategory: categoryId => {
    return del(`categories/${categoryId}`)
  },
  saveCategory: (category, legacyId) => {
    return post('categories', category)
    .then(savedCategory => {
      savedCategory.legacyId = legacyId
      return Promise.resolve(savedCategory)
    })
  },
  saveTopic: topic => {
    return post ('topics', topic)
  },
  saveTopicReply: (topic, parentId) => {
    return post (`topics/${parentId}`, topic)
  },
  saveUser: user => {
    return post('users', user)
  }
}
