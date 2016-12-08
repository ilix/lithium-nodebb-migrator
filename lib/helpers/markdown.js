'use strict'

const toMarkdown = require('to-markdown')

module.exports = {
  parse: content => {
    console.log()
    console.log('Convert to markdown', content)

    content = toMarkdown(content)

    console.log('Converted', content)
    console.log()
    return content
  }
}