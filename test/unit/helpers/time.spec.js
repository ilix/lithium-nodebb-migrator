'use strict'

const helper = require('../../../lib/helpers/time')

const chai = require('chai')
const expect = chai.expect

chai.use(require('sinon-chai'))

describe('helpers/time', () => {
  describe('convertChronoToUnixDate', () => {
    it('works', () => {
      expect(helper.convertChronoToUnixDate(201412071144484600)).to.eql(1417949088000)
      expect(helper.convertChronoToUnixDate(201411031716238500)).to.eql(1415031383000)
      expect(helper.convertChronoToUnixDate(201411161823029800)).to.eql(1416158582000)
      expect(helper.convertChronoToUnixDate(201509062224103029)).to.eql(1441571050000)
      expect(helper.convertChronoToUnixDate(201608090814058308)).to.eql(1470723245000)
    })
  })
})
