'use strict'

module.exports = {
  checkConfiguration: function () {
    const self = this

    Object.keys(self.keys).map(key => {
      console.log(key, `${process.env[key]}`)

      if (self.keys[key].required && !process.env[key] && !process.env.VIMLA_API_NOCHECK_VARS) {
        throw new Error(`Environment variable ${key} is required but not set.`)
      }
    })
  },
  keys: {
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
    }
  },
  print: function (data) {}
}
