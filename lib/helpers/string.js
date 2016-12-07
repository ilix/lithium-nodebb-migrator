'use strict'

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

module.exports = {
  decodeHtmlSymbols: s => {
    return entities.decode(s)
  }
}