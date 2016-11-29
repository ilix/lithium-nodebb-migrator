'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')
const logger = require('./logger')('service/category')

module.exports = {
  init: () => {
    const saving = []

    saving.push(api.saveCategory({
      name: 'Allt annat'
    }, 0))

    saving.push(api.saveCategory({
      name: 'Support'
    }, 0))

    saving.push(api.saveCategory({
      name: 'Labbet'
    }, 0))

    return Promise.all(saving)
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
        console.log('saved node', nodeSaveResult)
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