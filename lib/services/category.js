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
      // Allt annat
      parentCid = 7
      break
    case 24:
      // Support
      parentCid = 5
      break
    case 23:
      // Labbet
      parentCid = 8
      break
    case 11:
      // Guider
      parentCid = 6
      break
  }

  return api.saveCategory({
      name: node.nvalue,
      parentCid: parentCid
    }, node.node_id)
    .then(r => {
      logger.info(`Saved node "${r.payload.name} (ID: ${r.payload.cid})"`)
      _nodeCategoryMapping.push({
        categoryId: r.payload.cid,
        nodeId: r.legacyId
      })
    })
    .catch(error => {
      throw error
    })
}

module.exports = {
  init: () => {
    return [
      'Support',      // 5
      'Guider',       // 6
      'Allt annat',   // 7
      'Labbet'        // 8
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
        throw error
      })
  }
}