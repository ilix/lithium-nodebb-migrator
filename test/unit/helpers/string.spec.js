'use strict'

const helper = require('../../../lib/helpers/string')

const chai = require('chai')
const expect = chai.expect

chai.use(require('sinon-chai'))

describe('helpers/string', () => {
  describe('parseLiUserTag', () => {
    it('works', () => {
      expect(helper.parseLiUserTag('<li-user uid="27" login="Akilles"></li-user>')).to.eql('@Akilles')
      expect(helper.parseLiUserTag('Hello! <li-user uid="17" login="Tortoise"></li-user> Bla. bla. bla.')).to.eql('Hello! @Tortoise Bla. bla. bla.')
      expect(helper.parseLiUserTag('Hello <li-user uid="17" login="Tortoise"></li-user> and <li-user uid="27" login="Akilles"></li-user> - This sentence is false')).to.eql('Hello @Tortoise and @Akilles - This sentence is false')
    })
  })
})
