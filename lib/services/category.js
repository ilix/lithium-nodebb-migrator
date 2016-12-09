'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')
const logger = require('./logger')('service/category')

const _nodeCategoryMapping = []

function save (node) {
  let parentCid
  switch(node.parent_node_id) {
    case 25:
      parentCid = 5
      break
    case 24:
      parentCid = 6
      break
    case 23:
      parentCid = 7
  }

  return api.saveCategory({
      name: node.nvalue,
      parentCid: parentCid
    }, node.node_id)
    .then(r => {
      logger.info(`Saved node "${r.payload.name} (${r.payload.cid})"`)
      _nodeCategoryMapping.push({
        categoryId: r.payload.cid,
        nodeId: r.legacyId
      })
    })
}

module.exports = {
  init: () => {
    return [
      'Allt annat',
      'Support',
      'Labbet'
    ].reduce((chain, name) =>
      chain.then(() =>
        api.saveCategory({ name }, 0)), Promise.resolve())
  },
  process: () => {
    return mysql.getNodes()
      .then(nodes => {
        return nodes.reduce((chain, node) =>
          chain.then(() =>
            save(node)), Promise.resolve())
      })
      .then(() => {
        file.mkdirIfNotExists('./tmp')
        return file.saveJson(_nodeCategoryMapping, './tmp/nodeCategoryMapping.json')
      })
      .catch(error => {
        logger.error(error)
        throw error
      })
  }
}