'use strict'

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

module.exports = {
  decodeHtmlSymbols: s => {
    return entities.decode(s)
  },
  parseLiUserTag: s => {
    while (s.indexOf('<li-user') > -1) {
      // Find user tag.
      let liUserTag = s.replace(s.substring(0, s.indexOf('<li-user')), '')
      liUserTag = liUserTag.replace(liUserTag.substring(liUserTag.indexOf('</li-user>') + 10, liUserTag.length), '')

      // Find user.
      let user = liUserTag.replace(liUserTag.substring(0, liUserTag.indexOf('login="') + 7), '')
      user = user.replace(user.substring(user.indexOf('"'), user.indexOf('</li-user>') + 10), '')

      // Replace user tag.
      s = s.replace(liUserTag, `@${user}`)
    }

    return s
  }
}
