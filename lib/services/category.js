'use strict'

const api = require('../adapters/api')
const file = require('../helpers/file')
const mysql = require('../adapters/mysql')
const logger = require('./logger')('service/category')

module.exports = {
  process: () => {
    return mysql.getNodes()
      .then(nodes => {
        const saving = []
        nodes.map(node => {
          saving.push(api.saveCategory({
            name: node.display_id
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
      // .then(nodeSaveResult => {
      //   const nodeMessageImporting = []
      //   nodeSaveResult.map(n => {
      //     nodeMessageImporting.push(topics.importMessagesForNode(n.legacyId, n.payload.cid))
      //   })

      //   return Promise.all(nodeMessageImporting)
      // })
      .catch(error => {
        logger.error(error)
        throw error
      })
  }
}