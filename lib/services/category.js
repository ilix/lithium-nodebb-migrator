'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')
const logger = require('./logger')('service/category')

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
        const saving = []
        nodes.map(node => {
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
              break
          }
          saving.push(api.saveCategory({
            name: node.display_id,
            parentCid: parentCid
          }, node.node_id))
        })
        return Promise.all(saving)
      })
      .then(nodeSaveResult => {
        console.log('Saved node', nodeSaveResult)
        const nodeCategoryMapping = []
        nodeSaveResult.map(r => {
          nodeCategoryMapping.push({
            categoryId: r.payload.cid,
            nodeId: r.legacyId
          })
        })

        file.mkdirIfNotExists('./tmp')
        return file.saveJson(nodeCategoryMapping, './tmp/nodeCategoryMapping.json')
      })
      .catch(error => {
        logger.error(error)
        throw error
      })
  }
}