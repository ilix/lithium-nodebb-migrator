'use strict'

const fs = require('fs')

module.exports = {
  mkdirIfNotExists: path => {
    if (!fs.existsSync(path)){
      fs.mkdirSync(path);
    }
  },
  saveJson: (json, path) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, JSON.stringify(json), error => {
        if (error)  {
          return reject(error)
        }
        resolve()
      })
    })
  }
}
